/** Light/dark appearance: the user picks one, or follows the operating system. */
export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEMES = ['system', 'light', 'dark'] as const;

/** Keep in sync with --bg in styles.css so the mobile browser chrome matches. */
const THEME_COLOR: Record<ResolvedTheme, string> = { dark: '#0f1220', light: '#f5f6fb' };

const lightQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

export function systemTheme(): ResolvedTheme {
  return lightQuery()?.matches ? 'light' : 'dark';
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? systemTheme() : theme;
}

/** Paints the chosen theme onto <html>; returns the theme actually in use. */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
  }
  return resolved;
}

/** Notifies when the system appearance flips, so `system` follows it live. */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = lightQuery();
  if (!query) return () => {};
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
