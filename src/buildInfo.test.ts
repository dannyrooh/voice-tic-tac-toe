import { describe, expect, it } from 'vitest';
import { buildInfo, commitUrl, formatBuildDate } from './buildInfo.ts';

describe('build info', () => {
  it('is injected at build time, with a usable shape', () => {
    expect(buildInfo.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(buildInfo.commit).toMatch(/^[0-9a-f]{0,7}$/); // vazio quando não há git
    expect(buildInfo.env).toBeTruthy();
    expect(Number.isNaN(new Date(buildInfo.builtAt).getTime())).toBe(false);
  });

  it('formats the build date in the reader language', () => {
    const iso = '2026-09-20T18:30:00.000Z';
    expect(formatBuildDate(iso, 'pt')).toMatch(/2026/);
    expect(formatBuildDate(iso, 'en')).toMatch(/2026/);
    expect(formatBuildDate(iso, 'pt')).not.toBe(formatBuildDate(iso, 'en'));
  });

  it('survives a missing or invalid date instead of showing "Invalid Date"', () => {
    expect(formatBuildDate('', 'pt')).toBe('—');
    expect(formatBuildDate('not a date', 'en')).toBe('—');
  });

  it('links the commit only when there is one', () => {
    expect(commitUrl({ ...buildInfo, commit: 'abc1234' })).toContain('/commit/abc1234');
    expect(commitUrl({ ...buildInfo, commit: '' })).toBeNull();
  });
});
