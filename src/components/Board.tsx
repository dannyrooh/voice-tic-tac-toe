import type { Board as BoardT } from '../game/logic.ts';

interface Props {
  board: BoardT;
  winLine: readonly number[] | null;
  lastMove: number | null;
  disabled: boolean;
  cellLabel: (i: number) => string;
  onPlay: (i: number) => void;
}

export function Board({ board, winLine, lastMove, disabled, cellLabel, onPlay }: Props) {
  return (
    <div className="board" role="group" aria-label="Tabuleiro / Board">
      {board.map((value, i) => {
        const classes = [
          'cell',
          value ? `cell--${value.toLowerCase()}` : '',
          winLine?.includes(i) ? 'cell--win' : '',
          lastMove === i ? 'cell--last' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={i}
            type="button"
            className={classes}
            aria-label={`${cellLabel(i)}${value ? ` — ${value}` : ''}`}
            disabled={disabled || value !== null}
            onClick={() => onPlay(i)}
          >
            <span className="cell__num" aria-hidden="true">{i + 1}</span>
            {value && <span className="cell__mark">{value}</span>}
          </button>
        );
      })}
    </div>
  );
}
