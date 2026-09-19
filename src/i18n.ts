import type { GameEvent } from './commentary/events.ts';
import type { Difficulty } from './game/ai.ts';

export type Lang = 'pt' | 'en';

export const SPEECH_LANG: Record<Lang, string> = { pt: 'pt-BR', en: 'en-US' };

export const CELL_NAMES: Record<Lang, string[]> = {
  pt: [
    'canto superior esquerdo', 'topo, no meio', 'canto superior direito',
    'meio, à esquerda', 'centro', 'meio, à direita',
    'canto inferior esquerdo', 'embaixo, no meio', 'canto inferior direito',
  ],
  en: [
    'top left', 'top middle', 'top right',
    'middle left', 'center', 'middle right',
    'bottom left', 'bottom middle', 'bottom right',
  ],
};

export const UI = {
  pt: {
    title: 'Jogo da Velha por Voz',
    subtitle: 'Fale sua jogada. A IA responde — e comenta.',
    yourTurn: 'Sua vez (X)',
    aiThinking: 'A IA está pensando…',
    youWin: 'Você venceu!',
    aiWins: 'A IA venceu.',
    draw: 'Empate.',
    newGame: 'Novo jogo',
    undo: 'Desfazer',
    difficulty: 'Dificuldade',
    levels: { easy: 'Fácil', medium: 'Médio', hard: 'Impossível' } as Record<Difficulty, string>,
    aiStarts: 'IA começa',
    voiceOn: 'Parar microfone',
    voiceOff: 'Falar jogada',
    voiceUnsupported: 'Seu navegador não suporta reconhecimento de voz. Use o Chrome ou o Edge — ou clique/tecle 1–9.',
    listening: 'Ouvindo…',
    heard: 'Ouvi',
    notUnderstood: 'Não entendi. Tente “centro”, “canto superior esquerdo” ou um número de 1 a 9.',
    occupied: 'Essa casa já está ocupada.',
    speakOutLoud: 'IA fala em voz alta',
    score: 'Placar',
    you: 'Você',
    ai: 'IA',
    draws: 'Empates',
    moves: 'Jogadas',
    noMoves: 'Nenhuma jogada ainda.',
    hint: 'Diga: “centro”, “canto superior direito”, “embaixo no meio”, “cinco”, “novo jogo”…',
    cell: (i: number) => `Casa ${i + 1}: ${CELL_NAMES.pt[i]}`,
    moveLabel: (who: string, i: number) => `${who} → ${CELL_NAMES.pt[i]}`,
  },
  en: {
    title: 'Voice Tic-Tac-Toe',
    subtitle: 'Say your move. The AI answers — and talks back.',
    yourTurn: 'Your turn (X)',
    aiThinking: 'AI is thinking…',
    youWin: 'You win!',
    aiWins: 'The AI wins.',
    draw: 'Draw.',
    newGame: 'New game',
    undo: 'Undo',
    difficulty: 'Difficulty',
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Unbeatable' } as Record<Difficulty, string>,
    aiStarts: 'AI goes first',
    voiceOn: 'Stop mic',
    voiceOff: 'Speak a move',
    voiceUnsupported: 'Your browser does not support speech recognition. Try Chrome or Edge — or click / press 1–9.',
    listening: 'Listening…',
    heard: 'Heard',
    notUnderstood: 'Didn’t catch that. Try “center”, “top left” or a number from 1 to 9.',
    occupied: 'That square is taken.',
    speakOutLoud: 'AI speaks out loud',
    score: 'Score',
    you: 'You',
    ai: 'AI',
    draws: 'Draws',
    moves: 'Moves',
    noMoves: 'No moves yet.',
    hint: 'Say: “center”, “top right”, “bottom middle”, “five”, “new game”…',
    cell: (i: number) => `Square ${i + 1}: ${CELL_NAMES.en[i]}`,
    moveLabel: (who: string, i: number) => `${who} → ${CELL_NAMES.en[i]}`,
  },
} as const;

/** Local phrase bank — used when the optional LLM commentary is off or fails. */
export const PHRASES: Record<Lang, Record<GameEvent, string[]>> = {
  pt: {
    game_start: ['Vamos lá. Sua vez.', 'Tabuleiro limpo. Mostra o que você sabe.', 'Pode começar quando quiser.'],
    ai_move: ['Minha vez: {cell}.', 'Fico com {cell}.', '{cell}. Sua vez.', 'Jogo em {cell}. Pensa bem agora.'],
    ai_blocked: ['Bloqueado! Vi essa chegando.', 'Nada disso — {cell} é meu.', 'Quase, mas eu fechei em {cell}.'],
    ai_threat: ['Cuidado… {cell} me deixa a uma jogada de vencer.', 'Olha a ameaça ali.', '{cell}. Você viu o que eu fiz?'],
    ai_fork: ['Duas ameaças ao mesmo tempo. Qual você vai bloquear?', 'Armadilha montada.', 'Xeque-mate do jogo da velha.'],
    ai_wins: ['Venci! Quer revanche?', 'Três em linha. Mais uma?', 'Essa foi minha. Bora de novo?'],
    player_wins: ['Você venceu! Bem jogado.', 'Não acredito… parabéns!', 'Vitória sua. Vou treinar mais.'],
    draw: ['Empate. Ninguém cedeu.', 'Deu velha! Clássico.', 'Empatamos. Mais uma?'],
  },
  en: {
    game_start: ['Let’s go. Your move.', 'Fresh board. Show me what you’ve got.', 'Ready when you are.'],
    ai_move: ['I’ll take {cell}.', '{cell}. Your turn.', 'Going {cell}. Think carefully.', 'My move: {cell}.'],
    ai_blocked: ['Blocked! Saw that one coming.', 'Not so fast — {cell} is mine.', 'Nice try, I closed {cell}.'],
    ai_threat: ['Careful… {cell} puts me one move from winning.', 'Watch that threat.', '{cell}. Did you see that?'],
    ai_fork: ['Two threats at once. Which one will you block?', 'Trap set.', 'That’s checkmate, tic-tac-toe style.'],
    ai_wins: ['I win! Rematch?', 'Three in a row. One more?', 'That one’s mine. Again?'],
    player_wins: ['You win! Well played.', 'I can’t believe it… congrats!', 'Your victory. I’ll train harder.'],
    draw: ['Draw. Nobody blinked.', 'Stalemate — a classic.', 'It’s a tie. One more?'],
  },
};
