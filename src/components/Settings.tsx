import type { Difficulty } from '../game/ai.ts';
import type { Lang, UI } from '../i18n.ts';
import { THEMES, type Theme } from '../theme.ts';

interface Props {
  t: (typeof UI)[Lang];
  lang: Lang;
  difficulty: Difficulty;
  theme: Theme;
  aiStarts: boolean;
  voiceOut: boolean;
  ttsAvailable: boolean;
  storageAvailable: boolean;
  onLang: (value: Lang) => void;
  onDifficulty: (value: Difficulty) => void;
  onTheme: (value: Theme) => void;
  onAiStarts: (value: boolean) => void;
  onVoiceOut: (value: boolean) => void;
  onResetScore: () => void;
  onAbout: () => void;
}

/** A row of mutually exclusive choices — replaces the native selects of v1. */
function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Settings(props: Props) {
  const { t } = props;
  return (
    <div className="settings">
      <Segmented
        label={t.language}
        value={props.lang}
        options={[{ value: 'pt', label: 'Português' }, { value: 'en', label: 'English' }] as const}
        onChange={props.onLang}
      />
      <Segmented
        label={t.difficulty}
        value={props.difficulty}
        options={(['easy', 'medium', 'hard'] as const).map((d) => ({ value: d, label: t.levels[d] }))}
        onChange={props.onDifficulty}
      />
      <Segmented
        label={t.theme}
        value={props.theme}
        options={THEMES.map((value) => ({ value, label: t.themes[value] }))}
        onChange={props.onTheme}
      />

      <label className="switch">
        <span>{t.aiStarts}</span>
        <input type="checkbox" checked={props.aiStarts} onChange={(e) => props.onAiStarts(e.target.checked)} />
      </label>

      {props.ttsAvailable && (
        <label className="switch">
          <span>{t.speakOutLoud}</span>
          <input type="checkbox" checked={props.voiceOut} onChange={(e) => props.onVoiceOut(e.target.checked)} />
        </label>
      )}

      {!props.storageAvailable && <p className="note" role="status">{t.storageUnavailable}</p>}

      <button type="button" className="btn btn--ghost" onClick={props.onResetScore}>{t.resetScore}</button>
      <button type="button" className="btn btn--ghost" onClick={props.onAbout}>{t.about}</button>
    </div>
  );
}
