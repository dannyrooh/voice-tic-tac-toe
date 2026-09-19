/**
 * Vercel serverless function: short, playful commentary from Claude.
 *
 * Optional — the game works fully offline with its local phrase bank.
 * Enable with:
 *   ANTHROPIC_API_KEY=sk-ant-...        (server-side only, never exposed to the browser)
 *   VITE_LLM_COMMENTARY=true            (tells the frontend to call this endpoint)
 *   ANTHROPIC_MODEL=claude-haiku-4-5    (optional override)
 */

const EVENTS = new Set([
  'ai_wins', 'player_wins', 'draw', 'ai_blocked', 'ai_fork', 'ai_threat', 'ai_move', 'game_start',
]);

const EVENT_HINTS: Record<string, string> = {
  game_start: 'A new game is starting; invite the human to play.',
  ai_move: 'You (O) just made an ordinary move.',
  ai_blocked: 'You (O) just blocked the human from winning.',
  ai_threat: 'You (O) now threaten to win on your next move.',
  ai_fork: 'You (O) created two winning threats at once — the human cannot block both.',
  ai_wins: 'You (O) just won the game.',
  player_wins: 'The human (X) just beat you.',
  draw: 'The game ended in a draw.',
};

const CELL_NAMES = [
  'top left', 'top middle', 'top right',
  'middle left', 'center', 'middle right',
  'bottom left', 'bottom middle', 'bottom right',
];

type Cell = 'X' | 'O' | null;

function isValid(body: unknown): body is { event: string; board: Cell[]; cell: number | null; lang: 'pt' | 'en' } {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.event === 'string' && EVENTS.has(b.event) &&
    Array.isArray(b.board) && b.board.length === 9 &&
    b.board.every((c) => c === 'X' || c === 'O' || c === null) &&
    (b.cell === null || (Number.isInteger(b.cell) && (b.cell as number) >= 0 && (b.cell as number) <= 8)) &&
    (b.lang === 'pt' || b.lang === 'en')
  );
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'LLM commentary not configured' }, 501);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!isValid(body)) return json({ error: 'Invalid payload' }, 400);

  const { event, board, cell, lang } = body;
  const grid = [0, 3, 6]
    .map((r) => board.slice(r, r + 3).map((c) => c ?? '·').join(' '))
    .join('\n');

  const prompt = [
    `You are a witty, friendly tic-tac-toe opponent playing O against a human playing X.`,
    `Board now:\n${grid}`,
    cell !== null ? `Your last move: ${CELL_NAMES[cell]}.` : '',
    `Situation: ${EVENT_HINTS[event]}`,
    `Reply with ONE short spoken line (max 14 words) in ${lang === 'pt' ? 'Brazilian Portuguese' : 'English'}.`,
    `No emojis, no quotes, no markdown — it will be read aloud by text-to-speech.`,
  ].filter(Boolean).join('\n\n');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return json({ error: `Upstream ${res.status}` }, 502);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
    return json({ text });
  } catch {
    return json({ error: 'Upstream unavailable' }, 502);
  }
}
