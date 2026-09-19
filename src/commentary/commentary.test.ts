import { describe, expect, it } from 'vitest';
import type { Cell } from '../game/logic.ts';
import { localComment } from './comment.ts';
import { describeMove } from './events.ts';

const b = (s: string): Cell[] => [...s].map((c) => (c === 'X' || c === 'O' ? c : null));

describe('describeMove', () => {
  it('spots a block', () => {
    expect(describeMove(b('XX..O....'), b('XXO.O....'), 2, 'O', 'O')).toBe('ai_blocked');
  });
  it('spots a fork', () => {
    // O holds 0 and 8; playing 6 threatens both 3 and 7
    expect(describeMove(b('OX...X..O'), b('OX...XO.O'), 6, 'O', 'O')).toBe('ai_fork');
  });
  it('spots wins and draws', () => {
    expect(describeMove(b('OO.XX....'), b('OOOXX....'), 2, 'O', 'O')).toBe('ai_wins');
    expect(describeMove(b('XX.OO....'), b('XXXOO....'), 2, 'X', 'O')).toBe('player_wins');
    expect(describeMove(b('XOXXOOOX.'), b('XOXXOOOXX'), 8, 'X', 'O')).toBe('draw');
  });
});

describe('localComment', () => {
  it('fills in the cell name and never leaves a placeholder', () => {
    const text = localComment({ event: 'ai_move', board: b('.........'), cell: 4, lang: 'pt' }, () => 0);
    expect(text).toContain('centro');
    expect(text).not.toContain('{cell}');
    const en = localComment({ event: 'ai_blocked', board: b('.........'), cell: 0, lang: 'en' }, () => 0.99);
    expect(en).not.toContain('{cell}');
  });
});
