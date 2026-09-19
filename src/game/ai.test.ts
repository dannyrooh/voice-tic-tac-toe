import { describe, expect, it } from 'vitest';
import { chooseMove } from './ai.ts';
import { type Cell, type Player, emptyBoard, emptyCells, findWinner, opponent, play } from './logic.ts';

const b = (s: string): Cell[] => [...s].map((c) => (c === 'X' || c === 'O' ? c : null));

/** Explore every possible human reply; the hard AI must never lose. */
function neverLoses(board: Cell[], turn: Player, ai: Player): boolean {
  const win = findWinner(board);
  if (win) return win.winner === ai;
  if (emptyCells(board).length === 0) return true;
  if (turn === ai) {
    return neverLoses(play(board, chooseMove(board, ai, 'hard', () => 0), ai), opponent(ai), ai);
  }
  return emptyCells(board).every((i) => neverLoses(play(board, i, turn), ai, ai));
}

describe('ai', () => {
  it('hard AI is unbeatable when the human starts', () => {
    expect(neverLoses(emptyBoard(), 'X', 'O')).toBe(true);
  });

  it('hard AI is unbeatable when it starts', () => {
    expect(neverLoses(emptyBoard(), 'O', 'O')).toBe(true);
  });

  it('takes the win over blocking', () => {
    // O can win at 5; X threatens at 2
    expect(chooseMove(b('XX.OO....'), 'O', 'hard')).toBe(5);
    expect(chooseMove(b('XX.OO....'), 'O', 'medium')).toBe(5);
  });

  it('medium AI always blocks an immediate threat', () => {
    for (let k = 0; k < 20; k++) {
      expect(chooseMove(b('XX..O....'), 'O', 'medium')).toBe(2);
    }
  });

  it('easy AI only plays legal moves', () => {
    const board = b('XOX.O.X..');
    for (let k = 0; k < 50; k++) {
      expect(board[chooseMove(board, 'O', 'easy')]).toBeNull();
    }
  });
});
