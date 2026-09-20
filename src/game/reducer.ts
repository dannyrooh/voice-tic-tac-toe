import { type Cell, type Player, emptyBoard, findWinner, isDraw, isGameOver, play } from './logic.ts';

export const HUMAN: Player = 'X';
export const AI: Player = 'O';

export interface Move {
  player: Player;
  index: number;
}

export interface Score {
  you: number;
  ai: number;
  draws: number;
}

export interface GameState {
  gameId: number;
  firstPlayer: Player;
  moves: Move[];
  score: Score;
}

export type Action =
  | { type: 'move'; player: Player; index: number }
  | { type: 'undo' }
  | { type: 'resetScore' }
  | { type: 'restart'; firstPlayer: Player };

export const initialState = (firstPlayer: Player = HUMAN): GameState => ({
  gameId: 0,
  firstPlayer,
  moves: [],
  score: { you: 0, ai: 0, draws: 0 },
});

export const boardFrom = (moves: readonly Move[]): Cell[] =>
  moves.reduce<Cell[]>((b, m) => play(b, m.index, m.player), emptyBoard());

export const currentPlayer = (s: GameState): Player =>
  s.moves.length % 2 === 0 ? s.firstPlayer : s.firstPlayer === 'X' ? 'O' : 'X';

export function canPlay(s: GameState, player: Player, index: number): boolean {
  const board = boardFrom(s.moves);
  return !isGameOver(board) && currentPlayer(s) === player && board[index] === null;
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'move': {
      if (!canPlay(state, action.player, action.index)) return state;
      const moves = [...state.moves, { player: action.player, index: action.index }];
      const board = boardFrom(moves);
      const win = findWinner(board);
      const score = { ...state.score };
      if (win?.winner === HUMAN) score.you++;
      else if (win) score.ai++;
      else if (isDraw(board)) score.draws++;
      return { ...state, moves, score };
    }
    case 'undo': {
      if (isGameOver(boardFrom(state.moves))) return state;
      // Roll back to the human's previous turn (their move + the AI reply).
      const lastHuman = state.moves.map((m) => m.player).lastIndexOf(HUMAN);
      if (lastHuman === -1) return state;
      return { ...state, moves: state.moves.slice(0, lastHuman) };
    }
    case 'resetScore':
      return { ...state, score: { you: 0, ai: 0, draws: 0 } };
    case 'restart':
      return { ...state, gameId: state.gameId + 1, firstPlayer: action.firstPlayer, moves: [] };
  }
}
