import { describe, expect, it } from 'vitest';
import { type Cell, findWinner, isDraw, play, winningMoves } from './logic.ts';

const b = (s: string): Cell[] => [...s].map((c) => (c === 'X' || c === 'O' ? c : null));

describe('logic', () => {
  it('detects every winning line', () => {
    expect(findWinner(b('XXX......'))?.winner).toBe('X');
    expect(findWinner(b('O..O..O..'))?.line).toEqual([0, 3, 6]);
    expect(findWinner(b('..X.X.X..'))?.line).toEqual([2, 4, 6]);
    expect(findWinner(b('XOXOXOOXO'))).toBeNull();
  });

  it('detects a draw (the original tutorial missed this)', () => {
    expect(isDraw(b('XOXXOOOXX'))).toBe(true);
    expect(isDraw(b('XOX......'))).toBe(false);
  });

  it('rejects moves on occupied cells', () => {
    expect(() => play(b('X........'), 0, 'O')).toThrow();
  });

  it('finds immediate winning moves', () => {
    expect(winningMoves(b('XX.OO....'), 'X')).toEqual([2]);
    expect(winningMoves(b('XX.OO....'), 'O')).toEqual([5]);
  });
});
