import { describe, expect, it } from 'vitest';
import { parseCommand } from './parseCommand.ts';

const move = (t: string) => {
  const c = parseCommand(t);
  return c.type === 'move' ? c.index : c.type;
};

describe('parseCommand', () => {
  it.each<[string, number]>([
    ['canto superior esquerdo', 0],
    ['em cima no meio', 1],
    ['Canto Superior Direito', 2],
    ['meio à esquerda', 3],
    ['centro', 4],
    ['no meio', 4],
    ['meio direita', 5],
    ['embaixo à esquerda', 6],
    ['parte de baixo, no meio', 7],
    ['inferior direito', 8],
    ['cinco', 4],
    ['casa 9', 8],
    ['número três', 2],
    ['top left', 0],
    ['top middle', 1],
    ['center', 4],
    ['middle right', 5],
    ['bottom left corner', 6],
    ['lower right', 8],
    ['number seven', 6],
    ['esquerda', 3],
    ['direita', 5],
  ])('"%s" → %i', (text, index) => {
    expect(move(text)).toBe(index);
  });

  it('recognizes commands', () => {
    expect(parseCommand('novo jogo').type).toBe('restart');
    expect(parseCommand('Reiniciar!').type).toBe('restart');
    expect(parseCommand('new game please').type).toBe('restart');
    expect(parseCommand('desfazer').type).toBe('undo');
  });

  it('returns unknown for gibberish or contradictions', () => {
    expect(move('banana')).toBe('unknown');
    expect(move('esquerda direita')).toBe('unknown');
    expect(move('cima baixo')).toBe('unknown');
    expect(move('um dois')).toBe('unknown');
    expect(move('')).toBe('unknown');
  });
});
