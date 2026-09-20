import type { Lang } from './i18n.ts';

export interface BuildInfo {
  version: string;
  commit: string;
  branch: string;
  /** `production` or `preview` when built on Vercel, `local` otherwise. */
  env: string;
  /** ISO 8601, in UTC, of the moment the bundle was compiled. */
  builtAt: string;
  repository: string;
}

declare const __BUILD_INFO__: BuildInfo;

export const buildInfo: BuildInfo = __BUILD_INFO__;

const LOCALE: Record<Lang, string> = { pt: 'pt-BR', en: 'en-US' };

/** Compact enough for a phone row, in the reader's own time zone. */
export function formatBuildDate(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
}

/** The commit link, or null when the bundle was built without git. */
export function commitUrl(info: BuildInfo = buildInfo): string | null {
  return info.commit ? `${info.repository}/commit/${info.commit}` : null;
}
