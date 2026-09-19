import { describe, expect, it } from 'vitest';
import { AI, HUMAN, type GameState, currentPlayer, gameReducer, initialState } from './reducer.ts';

const run = (s: GameState, moves: [typeof HUMAN | typeof AI, number][]) =>
  moves.reduce((st, [player, index]) => gameReducer(st, { type: 'move', player, index }), s);

describe('reducer', () => {
  it('alternates turns and ignores out-of-turn moves', () => {
    let s = initialState();
    expect(currentPlayer(s)).toBe(HUMAN);
    s = gameReducer(s, { type: 'move', player: AI, index: 0 });
    expect(s.moves).toHaveLength(0);
    s = run(s, [[HUMAN, 4]]);
    expect(currentPlayer(s)).toBe(AI);
  });

  it('counts wins and draws once', () => {
    let s = run(initialState(), [[HUMAN, 0], [AI, 3], [HUMAN, 1], [AI, 4], [HUMAN, 2]]);
    expect(s.score).toEqual({ you: 1, ai: 0, draws: 0 });
    s = gameReducer(s, { type: 'move', player: AI, index: 8 }); // game over: ignored
    expect(s.score.you).toBe(1);
  });

  it('undo rolls back to the human turn', () => {
    const s = run(initialState(), [[HUMAN, 0], [AI, 4], [HUMAN, 8], [AI, 2]]);
    const u = gameReducer(s, { type: 'undo' });
    expect(u.moves.map((m) => m.index)).toEqual([0, 4]);
    expect(currentPlayer(u)).toBe(HUMAN);
  });

  it('restart lets the AI go first', () => {
    const s = gameReducer(initialState(), { type: 'restart', firstPlayer: AI });
    expect(currentPlayer(s)).toBe(AI);
    expect(s.gameId).toBe(1);
  });
});
