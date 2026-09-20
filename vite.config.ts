/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** Falls back quietly: a build from a tarball has no git, and that is fine. */
const git = (command: string): string => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

// O build acontece no runner do GitHub (`vercel build --prebuilt`), onde as
// variáveis VERCEL_GIT_* não existem e o checkout fica em HEAD destacado —
// `git rev-parse` devolveria o commit de merge e a branch como "HEAD". Por
// isso o workflow passa BUILD_COMMIT/BUILD_BRANCH explicitamente, e eles têm
// precedência. As demais origens cobrem o build feito na própria Vercel e o
// build local.
const commit = process.env.BUILD_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || git('git rev-parse HEAD');
const rawBranch = process.env.BUILD_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || git('git rev-parse --abbrev-ref HEAD');
const branch = rawBranch === 'HEAD' ? '' : rawBranch;

const buildInfo = {
  version: pkg.version,
  commit: commit.slice(0, 7),
  branch,
  // production | preview when built on Vercel, local otherwise.
  env: process.env.VERCEL_ENV || 'local',
  builtAt: new Date().toISOString(),
  repository: 'https://github.com/dannyrooh/voice-tic-tac-toe',
};

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
