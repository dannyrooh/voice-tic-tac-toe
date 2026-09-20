import { buildInfo, commitUrl, formatBuildDate } from '../buildInfo.ts';
import type { Lang, UI } from '../i18n.ts';

interface Props {
  t: (typeof UI)[Lang];
  lang: Lang;
}

/** Which build is running, so a report ("it is broken") can name a commit. */
export function About({ t, lang }: Props) {
  const link = commitUrl();
  const env = t.environments[buildInfo.env as keyof typeof t.environments] ?? buildInfo.env;

  return (
    <div className="about">
      <p className="about__tagline">{t.aboutTagline}</p>

      <dl className="facts">
        <div className="facts__row">
          <dt>{t.version}</dt>
          <dd>{buildInfo.version}</dd>
        </div>
        <div className="facts__row">
          <dt>{t.build}</dt>
          <dd>
            {link ? (
              <a href={link} target="_blank" rel="noreferrer noopener"><code>{buildInfo.commit}</code></a>
            ) : (
              <code>—</code>
            )}
          </dd>
        </div>
        {buildInfo.branch && (
          <div className="facts__row">
            <dt>{t.branch}</dt>
            <dd><code>{buildInfo.branch}</code></dd>
          </div>
        )}
        <div className="facts__row">
          <dt>{t.environment}</dt>
          <dd><span className={`badge badge--${buildInfo.env}`}>{env}</span></dd>
        </div>
        <div className="facts__row">
          <dt>{t.publishedAt}</dt>
          <dd>
            <time dateTime={buildInfo.builtAt}>{formatBuildDate(buildInfo.builtAt, lang)}</time>
          </dd>
        </div>
      </dl>

      <p className="note">{t.builtWith}: React 19 · TypeScript · Vite · Web Speech API · Minimax</p>
      <p className="note">
        <a href={buildInfo.repository} target="_blank" rel="noreferrer noopener">{t.openOnGitHub}</a>
      </p>
    </div>
  );
}
