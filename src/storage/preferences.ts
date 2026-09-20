import type { Difficulty } from '../game/ai.ts';
import type { Score } from '../game/reducer.ts';
import type { Lang } from '../i18n.ts';
import type { Theme } from '../theme.ts';

export const STORAGE_KEY = 'voice-tic-tac-toe:v1';
export interface Preferences {
  lang: Lang;
  difficulty: Difficulty;
  aiStarts: boolean;
  voiceOut: boolean;
  onboardingDone: boolean;
  theme: Theme;
  score: Score;
}

export function loadPreferences(lang: Lang, voiceOut: boolean): Preferences {
  const defaults: Preferences = {
    lang, difficulty: 'medium', aiStarts: false, voiceOut, onboardingDone: false, theme: 'system',
    score: { you: 0, ai: 0, draws: 0 },
  };
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return defaults;
    const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
    return {
      lang: value.lang === 'pt' || value.lang === 'en' ? value.lang : defaults.lang,
      difficulty: ['easy', 'medium', 'hard'].includes(value.difficulty) ? value.difficulty : defaults.difficulty,
      aiStarts: typeof value.aiStarts === 'boolean' ? value.aiStarts : defaults.aiStarts,
      voiceOut: typeof value.voiceOut === 'boolean' ? value.voiceOut : defaults.voiceOut,
      onboardingDone: value.onboardingDone === true,
      theme: ['system', 'light', 'dark'].includes(value.theme) ? value.theme : defaults.theme,
      score: { you: count(value.score?.you), ai: count(value.score?.ai), draws: count(value.score?.draws) },
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(value: Preferences): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false; // Storage may be blocked or full; the game still works in memory.
  }
}
