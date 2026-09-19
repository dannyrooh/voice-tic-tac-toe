import type { Board } from '../game/logic.ts';
import { CELL_NAMES, PHRASES, type Lang } from '../i18n.ts';
import type { GameEvent } from './events.ts';

export interface CommentRequest {
  event: GameEvent;
  board: Board;
  /** Cell the AI just played, if any. */
  cell: number | null;
  lang: Lang;
}

export function localComment({ event, cell, lang }: CommentRequest, rng: () => number = Math.random): string {
  const options = PHRASES[lang][event];
  const phrase = options[Math.floor(rng() * options.length)];
  const cellName = cell === null ? '' : CELL_NAMES[lang][cell];
  return phrase.replace('{cell}', cellName).replace(/^\w/, (c) => c.toUpperCase());
}

const LLM_ENABLED = import.meta.env?.VITE_LLM_COMMENTARY === 'true';

/**
 * Commentary for a game event. When VITE_LLM_COMMENTARY=true the text comes from
 * Claude through the /api/commentary serverless function; any failure or slow
 * response falls back to the local phrase bank so the game never stalls.
 */
export async function getComment(req: CommentRequest): Promise<string> {
  if (!LLM_ENABLED) return localComment(req);
  try {
    const res = await fetch('/api/commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || localComment(req);
  } catch {
    return localComment(req);
  }
}
