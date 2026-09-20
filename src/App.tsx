import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { loadPreferences, savePreferences } from './storage/preferences.ts';
import { Board } from './components/Board.tsx';
import { About } from './components/About.tsx';
import { Settings } from './components/Settings.tsx';
import { BrandMark, CloseIcon, GearIcon, HelpIcon, MicIcon, MoonIcon, SunIcon } from './components/icons.tsx';
import { getComment } from './commentary/comment.ts';
import { describeMove } from './commentary/events.ts';
import { type Difficulty, chooseMove } from './game/ai.ts';
import { findWinner, isDraw, isGameOver } from './game/logic.ts';
import { AI, HUMAN, boardFrom, canPlay, currentPlayer, gameReducer, initialState } from './game/reducer.ts';
import { SPEECH_LANG, UI, type Lang } from './i18n.ts';
import { type Theme, applyTheme, watchSystemTheme } from './theme.ts';
import { parseCommand } from './voice/parseCommand.ts';
import { isAiSpeaking, speak, stopSpeaking, ttsSupported } from './voice/speak.ts';
import { useSpeechRecognition } from './voice/useSpeechRecognition.ts';

const AI_DELAY_MS = 650;

const defaultLang = (): Lang =>
  typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';

export default function App() {
  const [saved] = useState(() => loadPreferences(defaultLang(), ttsSupported()));
  const [lang, setLang] = useState<Lang>(saved.lang);
  const [difficulty, setDifficulty] = useState<Difficulty>(saved.difficulty);
  const [aiStarts, setAiStarts] = useState(saved.aiStarts);
  const [voiceOut, setVoiceOut] = useState(saved.voiceOut && ttsSupported());
  const [theme, setTheme] = useState<Theme>(saved.theme);
  const [resolvedTheme, setResolvedTheme] = useState(() => applyTheme(saved.theme));
  const [onboardingDone, setOnboardingDone] = useState(saved.onboardingDone);
  const [showHelp, setShowHelp] = useState(!saved.onboardingDone);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [state, dispatch] = useReducer(gameReducer, saved, (settings) => ({
    ...initialState(settings.aiStarts ? AI : HUMAN), score: settings.score,
  }));
  const welcomeRef = useRef<HTMLHeadingElement>(null);
  const settingsRef = useRef<HTMLHeadingElement>(null);
  const aboutRef = useRef<HTMLHeadingElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setStorageAvailable(savePreferences({ lang, difficulty, aiStarts, voiceOut, onboardingDone, theme, score: state.score }));
  }, [lang, difficulty, aiStarts, voiceOut, onboardingDone, theme, state.score]);

  useEffect(() => {
    document.documentElement.lang = SPEECH_LANG[lang];
  }, [lang]);

  // Paint the theme, and keep following the OS while the choice is "system".
  useEffect(() => {
    setResolvedTheme(applyTheme(theme));
    if (theme !== 'system') return;
    return watchSystemTheme(() => setResolvedTheme(applyTheme('system')));
  }, [theme]);

  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState('');

  const t = UI[lang];
  const board = useMemo(() => boardFrom(state.moves), [state.moves]);
  const win = findWinner(board);
  const over = isGameOver(board);
  const turn = currentPlayer(state);
  const aiTurn = !over && turn === AI;
  const lastMove = state.moves.at(-1)?.index ?? null;
  const dialogOpen = showHelp || showSettings || showAbout;

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
    if (dialogOpen || !aiTurn) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'move', player: AI, index: chooseMove(board, AI, difficulty) });
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [aiTurn, board, difficulty, dialogOpen]);

  // --- Commentary ---------------------------------------------------------
  const commentToken = useRef(0);
  const prevMoveCount = useRef(0);
  useEffect(() => {
    const token = ++commentToken.current;
    if (showHelp) return;
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
  }, [state.moves, state.gameId, showHelp]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // --- Keyboard: 1-9 to play, N for a new game ----------------------------
  useEffect(() => {
    if (dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('select, input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) humanPlay(Number(e.key) - 1);
      else if (e.key.toLowerCase() === 'n') restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [humanPlay, restart, dialogOpen]);

  const openHelp = () => {
    mic.stop();
    stopSpeaking();
    ++commentToken.current;
    setShowSettings(false);
    setShowAbout(false);
    setShowHelp(true);
  };

  const finishWelcome = (withMic: boolean) => {
    setOnboardingDone(true);
    setShowHelp(false);
    if (withMic) mic.start();
  };

  // Focus each dialog when it opens; hand focus back to its button when it closes.
  // Skipped on the first render so the page doesn't load with a focus ring.
  const wasHelpOpen = useRef(showHelp);
  useEffect(() => {
    if (showHelp) welcomeRef.current?.focus();
    else if (wasHelpOpen.current) helpButtonRef.current?.focus();
    wasHelpOpen.current = showHelp;
  }, [showHelp]);

  const wasSettingsOpen = useRef(showSettings);
  useEffect(() => {
    if (showSettings) settingsRef.current?.focus();
    else if (wasSettingsOpen.current) settingsButtonRef.current?.focus();
    wasSettingsOpen.current = showSettings;
  }, [showSettings]);

  useEffect(() => { if (showAbout) aboutRef.current?.focus(); }, [showAbout]);

  // Esc closes whichever dialog is open (the welcome one only once it has been seen).
  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showAbout) setShowAbout(false); // volta para Configurações
      else if (showSettings) setShowSettings(false);
      else if (onboardingDone) setShowHelp(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogOpen, showAbout, showSettings, onboardingDone]);

  // Lock the page behind a dialog so mobile doesn't scroll the game underneath.
  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [dialogOpen]);

  const result = win
    ? win.winner === HUMAN ? t.youWin : t.aiWins
    : isDraw(board) ? t.draw
    : null;
  const outcome = win ? (win.winner === HUMAN ? 'win' : 'loss') : result ? 'draw' : '';

  const tally = [
    { value: state.score.you, long: t.tallyLong.wins, short: t.tallyShort.wins },
    { value: state.score.draws, long: t.tallyLong.draws, short: t.tallyShort.draws },
    { value: state.score.ai, long: t.tallyLong.losses, short: t.tallyShort.losses },
  ];

  return (
    <div className="shell">
      <header className="appbar">
        <div className="appbar__inner">
          <div className="appbar__brand">
            <BrandMark />
            <div className="appbar__titles">
              <h1 className="appbar__title">
                <span className="appbar__title--long">{t.title}</span>
                <span className="appbar__title--short">{t.shortTitle}</span>
              </h1>
              <p className="appbar__subtitle">{t.subtitle}</p>
            </div>
          </div>
          <div className="appbar__actions">
            <button
              type="button"
              className="iconbtn"
              aria-label={t.themeToggle}
              title={`${t.theme}: ${t.themes[theme]}`}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="iconbtn"
              ref={settingsButtonRef}
              aria-label={t.settings}
              title={t.settings}
              onClick={() => setShowSettings(true)}
            >
              <GearIcon />
            </button>
            <button type="button" className="iconbtn" ref={helpButtonRef} aria-label={t.help} title={t.help} onClick={openHelp}>
              <HelpIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="app" inert={dialogOpen || undefined}>
        <section className="play">
          <div className="stage">
            {result ? (
              <div className={`result result--${outcome}`} aria-live="polite">
                <p className="result__title">{result}</p>
                <p className="result__sub">{comment || ' '}</p>
              </div>
            ) : (
              <div className="turn" aria-live="polite">
                <p className="turn__who">
                  <span className={`turn__dot ${aiTurn ? 'turn__dot--ai' : ''}`} aria-hidden="true" />
                  {aiTurn ? t.aiThinking : t.yourTurn}
                </p>
                <p className="tally" aria-label={t.score}>
                  {tally.map((item) => (
                    <span key={item.long} className="tally__item">
                      <strong>{item.value}</strong>
                      <span className="tally__long">{item.long}</span>
                      <span className="tally__short">{item.short}</span>
                    </span>
                  ))}
                </p>
              </div>
            )}

            <Board
              board={board}
              winLine={win?.line ?? null}
              lastMove={lastMove}
              disabled={over || aiTurn}
              cellLabel={t.cell}
              onPlay={(i) => void humanPlay(i)}
            />
          </div>

          <div className="side">
            {!result && (
              <div className={`say ${comment ? '' : 'say--empty'}`} aria-live="polite">
                <span className="say__who" aria-hidden="true">{t.ai}</span>
                <p>{comment || '…'}</p>
              </div>
            )}

            <div className="controls">
              {result ? (
                <button type="button" className="btn btn--primary btn--big" onClick={() => restart()}>
                  {t.rematch}
                </button>
              ) : mic.supported ? (
                <button
                  type="button"
                  className={`btn btn--primary btn--big ${mic.listening ? 'is-on' : ''}`}
                  aria-pressed={mic.listening}
                  onClick={mic.listening ? mic.stop : mic.start}
                >
                  <MicIcon />
                  {mic.listening ? t.voiceOn : t.voiceOff}
                </button>
              ) : (
                <p className="note">{t.voiceUnsupported}</p>
              )}

              {mic.error ? (
                <p className="hint hint--error" role="alert">{t.microphoneBlocked}</p>
              ) : feedback ? (
                <p className="hint">{feedback}</p>
              ) : mic.listening ? (
                <p className="hint">{t.listening}</p>
              ) : !result ? (
                <p className="hint">{t.hint}</p>
              ) : null}

              {/* Once the game is over, Revanche already covers "new game"
                  and undo no longer applies, so the pair would be noise. */}
              {!result && (
                <div className="controls__secondary">
                  <button type="button" className="btn" onClick={() => restart()}>{t.newGame}</button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => dispatch({ type: 'undo' })}
                    disabled={aiTurn || !state.moves.some((m) => m.player === HUMAN)}
                  >
                    {t.undo}
                  </button>
                </div>
              )}
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
          </div>
        </section>
      </main>

      {showSettings && (
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <section className="sheet__card">
            <header className="sheet__head">
              <h2 id="settings-title" ref={settingsRef} tabIndex={-1}>{t.settings}</h2>
              <button type="button" className="iconbtn" aria-label={t.close} onClick={() => setShowSettings(false)}>
                <CloseIcon />
              </button>
            </header>
            <div className="sheet__body">
              <Settings
                t={t}
                lang={lang}
                difficulty={difficulty}
                theme={theme}
                aiStarts={aiStarts}
                voiceOut={voiceOut}
                ttsAvailable={ttsSupported()}
                storageAvailable={storageAvailable}
                onLang={setLang}
                onDifficulty={setDifficulty}
                onTheme={setTheme}
                onAiStarts={(value) => {
                  // Changing who starts begins a fresh game so the setting takes effect.
                  setAiStarts(value);
                  restart(value);
                }}
                onVoiceOut={(value) => {
                  setVoiceOut(value);
                  if (!value) stopSpeaking();
                }}
                onResetScore={() => {
                  if (window.confirm(t.confirmResetScore)) dispatch({ type: 'resetScore' });
                }}
                onAbout={() => setShowAbout(true)}
              />
            </div>
          </section>
        </div>
      )}

      {showAbout && (
        <div className="sheet sheet--stacked" role="dialog" aria-modal="true" aria-labelledby="about-title">
          <section className="sheet__card">
            <header className="sheet__head">
              <BrandMark />
              <h2 id="about-title" ref={aboutRef} tabIndex={-1}>{t.about}</h2>
              <button type="button" className="iconbtn" aria-label={t.close} onClick={() => setShowAbout(false)}>
                <CloseIcon />
              </button>
            </header>
            <div className="sheet__body">
              <About t={t} lang={lang} />
            </div>
          </section>
        </div>
      )}

      {showHelp && (
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <section className="sheet__card">
            <header className="sheet__head">
              <BrandMark />
              <h2 id="welcome-title" ref={welcomeRef} tabIndex={-1}>{t.welcome}</h2>
            </header>

            <div className="sheet__body">
              <div className="field">
                <span className="field__label">{t.languageChoice}</span>
                <div className="segmented" role="group" aria-label={t.language}>
                  {([['pt', 'Português'], ['en', 'English']] as const).map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={lang === value} onClick={() => setLang(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <ol className="steps" aria-label={t.welcomeSteps}>
                <li><span className="steps__num" aria-hidden="true">1</span><p>{t.rules}</p></li>
                <li><span className="steps__num" aria-hidden="true">2</span><p>{t.controls}</p></li>
                <li><span className="steps__num" aria-hidden="true">3</span><p>{t.microphoneHelp}</p></li>
              </ol>

              {!mic.supported && <p className="note">{t.voiceUnsupported}</p>}
              <p className="note">{storageAvailable ? t.savedLocally : t.storageUnavailable}</p>
            </div>

            <div className="sheet__actions">
              {mic.supported && (
                <button className="btn btn--primary" type="button" onClick={() => finishWelcome(true)}>{t.startVoice}</button>
              )}
              <button className="btn" type="button" onClick={() => finishWelcome(false)}>
                {onboardingDone ? t.backToGame : t.startWithoutVoice}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
