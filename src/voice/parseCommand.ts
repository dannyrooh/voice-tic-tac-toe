/**
 * Turns a spoken phrase (pt-BR or English) into a game command.
 *
 * Examples:
 *   "canto superior esquerdo"  -> move 0
 *   "centro" / "meio"          -> move 4
 *   "embaixo à direita"        -> move 8
 *   "cinco" / "number 5"       -> move 4 (cells numbered 1–9, left to right, top to bottom)
 *   "top middle"               -> move 1
 *   "novo jogo" / "restart"    -> restart
 */
export type VoiceCommand =
  | { type: 'move'; index: number }
  | { type: 'restart' }
  | { type: 'undo' }
  | { type: 'unknown'; transcript: string };

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, one: 1,
  dois: 2, duas: 2, two: 2,
  tres: 3, three: 3,
  quatro: 4, four: 4,
  cinco: 5, five: 5,
  seis: 6, six: 6,
  sete: 7, seven: 7,
  oito: 8, eight: 8,
  nove: 9, nine: 9,
};

const RESTART = [
  'novo jogo', 'nova partida', 'reiniciar', 'reinicia', 'recomecar', 'recomeca', 'jogar de novo',
  'new game', 'restart', 'reset', 'play again', 'start over',
];
const UNDO = ['desfazer', 'desfaz', 'voltar jogada', 'undo', 'take back'];

// Word stems. Matched against whole tokens with startsWith, so "esquerdo/esquerda" both hit "esquerd".
const TOP = ['superior', 'cima', 'alto', 'topo', 'top', 'upper', 'up'];
const BOTTOM = ['inferior', 'baixo', 'embaixo', 'bottom', 'lower', 'down'];
const LEFT = ['esquerd', 'left'];
const RIGHT = ['direit', 'right'];
const CENTER = ['centro', 'central', 'meio', 'middle', 'center', 'centre', 'mid'];

const hasStem = (tokens: string[], stems: string[]) =>
  tokens.some((t) => stems.some((s) => t.startsWith(s)));

const includesPhrase = (text: string, phrases: string[]) =>
  phrases.some((p) => ` ${text} `.includes(` ${p} `));

export function parseCommand(transcript: string): VoiceCommand {
  const text = normalize(transcript);
  if (!text) return { type: 'unknown', transcript };

  if (includesPhrase(text, RESTART)) return { type: 'restart' };
  if (includesPhrase(text, UNDO)) return { type: 'undo' };

  const tokens = text.split(' ');

  // 1) Cell numbers: "5", "cinco", "casa 5", "number five"
  const numbers = tokens
    .map((t) => (/^[1-9]$/.test(t) ? Number(t) : NUMBER_WORDS[t]))
    .filter((n): n is number => n !== undefined);
  if (numbers.length === 1) return { type: 'move', index: numbers[0] - 1 };

  // 2) Positions: row words + column words
  const top = hasStem(tokens, TOP);
  const bottom = hasStem(tokens, BOTTOM);
  const left = hasStem(tokens, LEFT);
  const right = hasStem(tokens, RIGHT);
  const center = hasStem(tokens, CENTER);

  if (top && bottom) return { type: 'unknown', transcript };
  if (left && right) return { type: 'unknown', transcript };

  const row = top ? 0 : bottom ? 2 : center || left || right ? 1 : null;
  const col = left ? 0 : right ? 2 : center || top || bottom ? 1 : null;

  if (row === null || col === null) return { type: 'unknown', transcript };
  return { type: 'move', index: row * 3 + col };
}
