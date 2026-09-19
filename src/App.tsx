import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Board } from './components/Board.tsx';
import { getComment } from './commentary/comment.ts';
import { describeMove } from './commentary/events.ts';
import { type Difficulty, chooseMove } from './game/ai.ts';
import { findWinner, isDraw, isGameOver } from './game/logic.ts';
import { AI, HUMAN, boardFrom, canPlay, currentPlayer, gameReducer, initialState } from './game/reducer.ts';
import { SPEECH_LANG, UI, type Lang } from './i18n.ts';
import { parseCommand } from './voice/parseCommand.ts';
import { isAiSpeaking, speak, stopSpeaking, ttsSupported } from './voice/speak.ts';
import { useSpeechRecognition } from './voice/useSpeechRecognition.ts';

const AI_DELAY_MS = 650;

const defaultLang = (): Lang =>
  typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';

export default function App() {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aiStarts, setAiStarts] = useState(false);
  const [voiceOut, setVoiceOut] = useState(ttsSupported());
  const [state, dispatch] = useReducer(gameReducer, HUMAN, initialState);
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState('');

  const t = UI[lang];
  const board = useMemo(() => boardFrom(state.moves), [state.moves]);
  const win = findWinner(board);
  const over = isGameOver(board);
  const turn = currentPlayer(state);
  const aiTurn = !over && turn === AI;
  const lastMove = state.moves.at(-1)?.index ?? null;

  // Latest values for callbacks that outlive a render (speech events, timers).
  const live = useRef({ state, lang, voiceOut, aiStarts });
  live.current = { state, lang, voiceOut, aiStarts };

  const say = useCallback((text: string) => {
    setComment(text);
    if (live.current.voiceOut) speak(text, SPEECH_LANG[live.current.lang]);
  }, []);

  const restart = useCallback((aiFirst: boolean = live.current.aiStarts) => {
    stopSpeaking();
    setFeedback('');
    setComment('');
    dispatch({ type: 'restart', firstPlayer: aiFirst ? AI : HUMAN });
  }, []);

  /** Returns true if the move was accepted. */
  const humanPlay = useCallback((index: number): boolean => {
    const { state: s, lang: l } = live.current;
    if (!canPlay(s, HUMAN, index)) {
      if (!isGameOver(boardFrom(s.moves)) && currentPlayer(s) === HUMAN) setFeedback(UI[l].occupied);
      return false;
    }
    setFeedback('');
    dispatch({ type: 'move', player: HUMAN, index });
    return true;
  }, []);

  // --- AI turn ------------------------------------------------------------
  useEffect(() => {
    if (!aiTurn) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'move', player: AI, index: chooseMove(board, AI, difficulty) });
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [aiTurn, board, difficulty]);

  // --- Commentary ---------------------------------------------------------
  const commentToken = useRef(0);
  const prevMoveCount = useRef(0);
  useEffect(() => {
    const token = ++commentToken.current;
    const { moves, firstPlayer } = state;
    const l = live.current.lang;
    const wasUndo = moves.length > 0 && moves.length < prevMoveCount.current;
    prevMoveCount.current = moves.length;
    if (wasUndo) return; // no commentary when rolling back

    if (moves.length === 0) {
      if (firstPlayer === HUMAN) {
        getComment({ event: 'game_start', board, cell: null, lang: l }).then((text) => {
          if (token === commentToken.current) say(text);
        });
      }
      return;
    }

    const last = moves[moves.length - 1];
    const before = boardFrom(moves.slice(0, -1));
    const event = describeMove(before, board, last.index, last.player, AI);
    const shouldComment = last.player === AI || event === 'player_wins' || event === 'draw';
    if (!shouldComment) return;

    getComment({ event, board, cell: last.player === AI ? last.index : null, lang: l }).then((text) => {
      if (token === commentToken.current) say(text);
    });
  }, [state.moves, state.gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Voice input --------------------------------------------------------
  const onTranscript = useCallback(
    (transcript: string) => {
      if (isAiSpeaking()) return; // don't let the mic hear the AI's own voice
      const l = live.current.lang;
      const cmd = parseCommand(transcript);
      const heard = `${UI[l].heard}: “${transcript.trim()}”`;
      if (cmd.type === 'restart') restart();
      else if (cmd.type === 'undo') dispatch({ type: 'undo' });
      else if (cmd.type === 'move') {
        if (!humanPlay(cmd.index)) return; // humanPlay already explained why
      } else {
        setFeedback(`${heard} — ${UI[l].notUnderstood}`);
        return;
      }
      setFeedback(heard);
    },
    [humanPlay, restart],
  );
  const mic = useSpeechRecognition(SPEECH_LANG[lang], onTranscript);

  // --- Keyboard: 1–9 to play, N for a new game ----------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('select, input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) humanPlay(Number(e.key) - 1);
      else if (e.key.toLowerCase() === 'n') restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [humanPlay, restart]);

  const status = win
    ? win.winner === HUMAN ? t.youWin : t.aiWins
    : isDraw(board) ? t.draw
    : aiTurn ? t.aiThinking
    : t.yourTurn;

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="lang" role="group" aria-label="Idioma / Language">
          {(['pt', 'en'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l === 'pt' ? 'PT' : 'EN'}
            </button>
          ))}
        </div>
      </header>

      <section className="play">
        <div className="play__board">
          <p className={`status ${over ? 'status--over' : ''}`} aria-live="polite">{status}</p>
          <Board
            board={board}
            winLine={win?.line ?? null}
            lastMove={lastMove}
            disabled={over || aiTurn}
            cellLabel={t.cell}
            onPlay={(i) => void humanPlay(i)}
          />
          <div className="actions">
            <button type="button" className="btn btn--primary" onClick={() => restart()}>{t.newGame}</button>
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'undo' })}
              disabled={over || aiTurn || !state.moves.some((m) => m.player === HUMAN)}
            >
              {t.undo}
            </button>
          </div>
        </div>

        <aside className="panel">
          <div className={`bubble ${comment ? '' : 'bubble--empty'}`} aria-live="polite">
            <span className="bubble__who">{t.ai}</span>
            <p>{comment || '…'}</p>
          </div>

          <div className="mic">
            {mic.supported ? (
              <button
                type="button"
                className={`btn btn--mic ${mic.listening ? 'is-on' : ''}`}
                aria-pressed={mic.listening}
                onClick={mic.listening ? mic.stop : mic.start}
              >
                <span className="mic__dot" aria-hidden="true" />
                {mic.listening ? t.voiceOn : t.voiceOff}
              </button>
            ) : (
              <p className="note">{t.voiceUnsupported}</p>
            )}
            {mic.listening && <p className="note">{t.listening}</p>}
            {mic.error && <p className="note note--error">Mic: {mic.error}</p>}
            {feedback && <p className="note">{feedback}</p>}
            <p className="hint">{t.hint}</p>
          </div>

          <div className="settings">
            <label>
              {t.difficulty}
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <option key={d} value={d}>{t.levels[d]}</option>
                ))}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={aiStarts} onChange={(e) => {
                  // Changing who starts begins a fresh game so the setting takes effect.
                  setAiStarts(e.target.checked);
                  restart(e.target.checked);
                }}
              />
              {t.aiStarts}
            </label>
            {ttsSupported() && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={voiceOut}
                  onChange={(e) => {
                    setVoiceOut(e.target.checked);
                    if (!e.target.checked) stopSpeaking();
                  }}
                />
                {t.speakOutLoud}
              </label>
            )}
          </div>

          <div className="score" aria-label={t.score}>
            <div><strong>{state.score.you}</strong><span>{t.you}</span></div>
            <div><strong>{state.score.draws}</strong><span>{t.draws}</span></div>
            <div><strong>{state.score.ai}</strong><span>{t.ai}</span></div>
          </div>

          <div className="moves">
            <h2>{t.moves}</h2>
            {state.moves.length === 0 ? (
              <p className="note">{t.noMoves}</p>
            ) : (
              <ol>
                {state.moves.map((m, i) => (
                  <li key={i} className={`moves__${m.player.toLowerCase()}`}>
                    {t.moveLabel(m.player === HUMAN ? `${t.you} (X)` : `${t.ai} (O)`, m.index)}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </section>

      <footer className="footer">
        React 19 · TypeScript · Web Speech API · Minimax · Claude (opcional) —{' '}
        <a href="https://github.com/dannyrooh/tic-tac-toe-react">GitHub</a>
      </footer>
    </main>
  );
}
