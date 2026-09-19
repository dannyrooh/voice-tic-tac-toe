export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = readonly Cell[];

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const emptyBoard = (): Cell[] => Array<Cell>(9).fill(null);

export const opponent = (p: Player): Player => (p === 'X' ? 'O' : 'X');

export interface WinResult {
  winner: Player;
  line: readonly [number, number, number];
}

export function findWinner(board: Board): WinResult | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return { winner: v, line };
  }
  return null;
}

export const emptyCells = (board: Board): number[] =>
  board.flatMap((v, i) => (v === null ? [i] : []));

export const isDraw = (board: Board): boolean =>
  !findWinner(board) && emptyCells(board).length === 0;

export const isGameOver = (board: Board): boolean =>
  findWinner(board) !== null || emptyCells(board).length === 0;

export function play(board: Board, index: number, player: Player): Cell[] {
  if (index < 0 || index > 8 || board[index] !== null) {
    throw new Error(`Invalid move: ${index}`);
  }
  const next = board.slice();
  next[index] = player;
  return next;
}

/** Cells where `player` would win immediately by playing there. */
export function winningMoves(board: Board, player: Player): number[] {
  return emptyCells(board).filter((i) => findWinner(play(board, i, player))?.winner === player);
}
