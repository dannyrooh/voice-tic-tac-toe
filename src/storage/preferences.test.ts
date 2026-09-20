import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPreferences, savePreferences, STORAGE_KEY } from './preferences.ts';
import { AI, gameReducer, HUMAN, initialState } from '../game/reducer.ts';

afterEach(() => vi.unstubAllGlobals());
const storage = (value: string | null = null) => {
  let stored = value;
  const mock = { getItem: vi.fn(() => stored), setItem: vi.fn((_key: string, next: string) => { stored = next; }) };
  vi.stubGlobal('localStorage', mock);
  return mock;
};

describe('local preferences and score', () => {
  it('shows onboarding on a first visit using the browser language', () => {
    storage();
    expect(loadPreferences('pt', true)).toMatchObject({ lang: 'pt', onboardingDone: false, score: { you: 0, ai: 0, draws: 0 } });
  });

  it('restores preferences and score on a later visit', () => {
    const mock = storage();
    const settings = { ...loadPreferences('en', true), lang: 'pt' as const, difficulty: 'hard' as const,
      aiStarts: true, voiceOut: false, onboardingDone: true, theme: 'dark' as const, score: { you: 3, ai: 2, draws: 1 } };
    expect(savePreferences(settings)).toBe(true);
    expect(mock.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(settings));
    expect(loadPreferences('en', true)).toEqual(settings);
  });

  it.each(['invalid', 'null', '42', '[]'])('recovers from invalid saved data: %s', (value) => {
    storage(value);
    expect(loadPreferences('pt', false)).toEqual({ lang: 'pt', difficulty: 'medium', aiStarts: false,
      voiceOut: false, onboardingDone: false, theme: 'system', score: { you: 0, ai: 0, draws: 0 } });
  });

  it('validates fields independently and rejects invalid score counts', () => {
    storage(JSON.stringify({ lang: 'xx', difficulty: 'expert', voiceOut: 'false', aiStarts: 1,
      onboardingDone: 'true', theme: 'neon', score: { you: -1, ai: 1.5, draws: 4 } }));
    expect(loadPreferences('en', false)).toMatchObject({ lang: 'en', difficulty: 'medium',
      voiceOut: false, aiStarts: false, onboardingDone: false, theme: 'system', score: { you: 0, ai: 0, draws: 4 } });
  });

  it('keeps playing when storage is blocked or full', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } });
    const settings = loadPreferences('en', false);
    expect(settings.onboardingDone).toBe(false);
    expect(savePreferences(settings)).toBe(false);
  });

  it('preserves score across reloads and new games without counting a win twice', () => {
    storage();
    let state = initialState();
    for (const [player, index] of [[HUMAN, 0], [AI, 3], [HUMAN, 1], [AI, 4], [HUMAN, 2]] as const) {
      state = gameReducer(state, { type: 'move', player, index });
    }
    savePreferences({ ...loadPreferences('pt', false), score: state.score });
    const restored = { ...initialState(), score: loadPreferences('pt', false).score };
    expect(gameReducer(restored, { type: 'restart', firstPlayer: HUMAN }).score.you).toBe(1);
    expect(gameReducer(state, { type: 'move', player: HUMAN, index: 8 }).score.you).toBe(1);
    expect(gameReducer(restored, { type: 'resetScore' }).score).toEqual({ you: 0, ai: 0, draws: 0 });
  });
});
