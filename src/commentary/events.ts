import { type Board, type Player, findWinner, isDraw, opponent, winningMoves } from '../game/logic.ts';

export type GameEvent =
  | 'ai_wins'
  | 'player_wins'
  | 'draw'
  | 'ai_blocked'
  | 'ai_fork'
  | 'ai_threat'
  | 'ai_move'
  | 'game_start';

/**
 * Describe what just happened after `mover` played `index`
 * (`before` is the board before the move, `after` the board after it).
 */
export function describeMove(
  before: Board,
  after: Board,
  index: number,
  mover: Player,
  ai: Player,
): GameEvent {
  const win = findWinner(after);
  if (win) return win.winner === ai ? 'ai_wins' : 'player_wins';
  if (isDraw(after)) return 'draw';
  if (mover !== ai) return 'ai_move';

  const blocked = winningMoves(before, opponent(ai)).includes(index);
  if (blocked) return 'ai_blocked';

  const threats = winningMoves(after, ai).length;
  if (threats >= 2) return 'ai_fork';
  if (threats === 1) return 'ai_threat';
  return 'ai_move';
}
