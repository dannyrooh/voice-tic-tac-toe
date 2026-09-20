import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../api/commentary.ts';

const payload = { event: 'game_start', board: Array(9).fill(null), cell: null, lang: 'pt' };
const request = (body: unknown = payload) => new Request('http://localhost/api/commentary', {
  method: 'POST', body: JSON.stringify(body),
});
const geminiResponse = () => Response.json({ candidates: [{ content: { parts: [
  { text: 'Private reasoning', thought: true }, { text: ' Sua vez! ' },
] } }] });
const claudeResponse = () => Response.json({ content: [{ type: 'text', text: ' Vamos jogar! ' }] });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'gemini-test-key');
  vi.stubEnv('ANTHROPIC_API_KEY', 'claude-test-key');
  vi.stubEnv('GROQ_API_KEY', '');
  vi.stubEnv('GROQ_MODEL', '');
  vi.stubEnv('GEMINI_MODEL', '');
  vi.stubEnv('ANTHROPIC_MODEL', '');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('commentary provider fallback', () => {
  it('prefers Gemini and excludes thought parts', async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse());
    const response = await POST(request());
    expect(await response.json()).toEqual({ text: 'Sua vez!' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/gemini-3.1-flash-lite:generateContent');
    expect(init?.headers).toHaveProperty('x-goog-api-key', 'gemini-test-key');
    expect(JSON.parse(init!.body as string).generationConfig.thinkingConfig)
      .toEqual({ thinkingLevel: 'minimal' });
  });

  it.each([
    ['rate limit', () => new Response('', { status: 429 })],
    ['server error', () => new Response('', { status: 500 })],
    ['empty output', () => Response.json({ candidates: [] })],
    ['blank output', () => Response.json({ candidates: [{ content: { parts: [{ text: ' ' }] } }] })],
    ['invalid JSON', () => new Response('invalid')],
  ])('uses Claude after Gemini %s', async (_name, failure) => {
    fetchMock.mockResolvedValueOnce(failure()).mockResolvedValueOnce(claudeResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Vamos jogar!' });
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.anthropic.com/v1/messages');
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string).model).toBe('claude-haiku-4-5');
  });

  it('uses Claude after a Gemini network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network error')).mockResolvedValueOnce(claudeResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Vamos jogar!' });
  });

  it('aborts a slow Gemini request and still tries Claude', async () => {
    fetchMock.mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
    })).mockResolvedValueOnce(claudeResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Vamos jogar!' });
    expect(fetchMock.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });

  it('supports an existing Claude-only configuration', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    fetchMock.mockResolvedValueOnce(claudeResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Vamos jogar!' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('api.anthropic.com');
  });

  it('supports Gemini without a Claude key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    fetchMock.mockResolvedValueOnce(geminiResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Sua vez!' });
  });

  it('returns an error for local fallback if Gemini fails without a Claude key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    fetchMock.mockRejectedValueOnce(new Error('Unavailable'));
    expect((await POST(request())).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an error for local fallback when both providers fail', async () => {
    fetchMock.mockRejectedValue(new Error('Unavailable'));
    expect((await POST(request())).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns an error if Claude also has no text', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({})).mockResolvedValueOnce(Response.json({ content: [] }));
    expect((await POST(request())).status).toBe(502);
  });

  it('skips all calls when no keys are configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect((await POST(request())).status).toBe(501);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid payloads before calling providers', async () => {
    expect((await POST(request({ ...payload, event: 'invalid' }))).status).toBe(400);
    expect((await POST(new Request('http://localhost/api/commentary', {
      method: 'POST', body: 'invalid JSON',
    }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('honors model overrides for both providers', async () => {
    vi.stubEnv('GEMINI_MODEL', 'custom-gemini');
    vi.stubEnv('ANTHROPIC_MODEL', 'custom-claude');
    fetchMock.mockResolvedValueOnce(Response.json({})).mockResolvedValueOnce(claudeResponse());
    await POST(request());
    expect(fetchMock.mock.calls[0][0]).toContain('/custom-gemini:generateContent');
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string).model).toBe('custom-claude');
  });
});


describe('Groq priority before Claude', () => {
  const groqResponse = () => Response.json({ choices: [{ message: { content: ' Boa jogada! ' } }] });
  beforeEach(() => vi.stubEnv('GROQ_API_KEY', 'groq-test-key'));

  it('never calls either fallback when Gemini succeeds', async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Sua vez!' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses Groq after Gemini fails and never calls Claude on success', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Gemini unavailable')).mockResolvedValueOnce(groqResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Boa jogada!' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init?.headers).toHaveProperty('Authorization', 'Bearer groq-test-key');
    expect(JSON.parse(init!.body as string).model).toBe('qwen/qwen3.8-27b');
  });

  it.each([
    ['quota exceeded', () => Promise.resolve(new Response('', { status: 429 }))],
    ['server error', () => Promise.resolve(new Response('', { status: 500 }))],
    ['network error', () => Promise.reject(new TypeError('Network error'))],
    ['invalid JSON', () => Promise.resolve(new Response('invalid'))],
    ['empty response', () => Promise.resolve(Response.json({ choices: [] }))],
    ['blank text', () => Promise.resolve(Response.json({ choices: [{ message: { content: ' ' } }] }))],
    ['non-text response', () => Promise.resolve(Response.json({ choices: [{ message: { content: 42 } }] }))],
  ])('calls Claude last after Groq %s', async (_name, failure) => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockImplementationOnce(failure).mockResolvedValueOnce(claudeResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Vamos jogar!' });
    expect(fetchMock.mock.calls.map(([url]) => new URL(String(url)).hostname)).toEqual([
      'generativelanguage.googleapis.com', 'api.groq.com', 'api.anthropic.com',
    ]);
  });

  it('reserves time for Claude after both previous providers time out', async () => {
    const slow: typeof fetch = (_url, init) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true });
    });
    fetchMock.mockImplementationOnce(slow).mockImplementationOnce(slow).mockResolvedValueOnce(claudeResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Vamos jogar!' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1]!.signal!.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][1]!.signal!.aborted).toBe(true);
  });

  it('supports Groq alone and a model override', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('GROQ_MODEL', 'custom-groq');
    fetchMock.mockResolvedValueOnce(groqResponse());
    expect(await (await POST(request())).json()).toEqual({ text: 'Boa jogada!' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).model).toBe('custom-groq');
  });

  it('returns an error for local phrases when all three fail', async () => {
    fetchMock.mockRejectedValue(new Error('Unavailable'));
    expect((await POST(request())).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
