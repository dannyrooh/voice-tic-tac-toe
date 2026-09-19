import {
  type Board,
  type Player,
  emptyCells,
  findWinner,
  opponent,
  play,
  winningMoves,
} from './logic.ts';

export type Difficulty = 'easy' | 'medium' | 'hard';

type Rng = () => number;

const pick = <T,>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

/**
 * Minimax score from `me`'s point of view.
 * Faster wins score higher, slower losses score less negative.
 */
function minimax(board: Board, turn: Player, me: Player, depth: number): number {
  const win = findWinner(board);
  if (win) return win.winner === me ? 10 - depth : depth - 10;
  const free = emptyCells(board);
  if (free.length === 0) return 0;

  const scores = free.map((i) => minimax(play(board, i, turn), opponent(turn), me, depth + 1));
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

/** All moves with the best minimax score (ties are kept so the AI isn't predictable). */
export function bestMoves(board: Board, me: Player): number[] {
  const free = emptyCells(board);
  if (free.length === 0) return [];
  const scored = free.map((i) => ({
    i,
    score: minimax(play(board, i, me), opponent(me), me, 1),
  }));
  const top = Math.max(...scored.map((s) => s.score));
  return scored.filter((s) => s.score === top).map((s) => s.i);
}

/**
 * Choose a move for `me`.
 * - easy: random, but takes an obvious win half the time
 * - medium: always wins/blocks when it can, otherwise plays perfectly 50% of the time
 * - hard: perfect play (unbeatable)
 */
export function chooseMove(
  board: Board,
  me: Player,
  difficulty: Difficulty,
  rng: Rng = Math.random,
): number {
  const free = emptyCells(board);
  if (free.length === 0) throw new Error('No moves left');

  if (difficulty === 'hard') return pick(bestMoves(board, me), rng);

  const wins = winningMoves(board, me);
  if (difficulty === 'easy') {
    if (wins.length && rng() < 0.5) return pick(wins, rng);
    return pick(free, rng);
  }

  // medium
  if (wins.length) return pick(wins, rng);
  const blocks = winningMoves(board, opponent(me));
  if (blocks.length) return pick(blocks, rng);
  return rng() < 0.5 ? pick(bestMoves(board, me), rng) : pick(free, rng);
}
