import type { Episode } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import { statusCounts } from '../services/episode-service';
import { formatDateTime } from '../services/format';
import { EmptyBlock, StatusTag } from './common';

export function OverviewScreen({
  episodes,
  onCreate,
  onOpenEpisodes,
  onOpenEpisode,
}: {
  readonly episodes: readonly Episode[];
  readonly onCreate: () => void;
  readonly onOpenEpisodes: () => void;
  readonly onOpenEpisode: (episodeId: string) => void;
}) {
  const counts = statusCounts(episodes);
  const recent = episodes.slice(0, 5);

  return (
    <div className="screen">
      <header className="app-header">
        <span className="app-mark" aria-hidden="true">SD</span>
        <div>
          <p className="eyebrow">{copy.app.tagline}</p>
          <h1>{copy.overview.title}</h1>
        </div>
      </header>

      <section className="stat-strip" aria-label="Episode pipeline">
        <article className="stat-cell">
          <span>{copy.overview.total}</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat-cell">
          <span>{copy.overview.drafts}</span>
          <strong>{counts.draft}</strong>
        </article>
        <article className="stat-cell">
          <span>{copy.overview.published}</span>
          <strong>{counts.published}</strong>
        </article>
        <article className="stat-cell">
          <span>{copy.overview.retired}</span>
          <strong>{counts.retired}</strong>
        </article>
      </section>

      <section className="section" aria-label={copy.overview.recent}>
        <div className="section-head">
          <h2>{copy.overview.recent}</h2>
          <button type="button" className="text-button" onClick={onOpenEpisodes}>
            {copy.overview.open} →
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyBlock
            title={copy.overview.empty}
            hint={copy.episodes.emptyHint}
            action={{ label: copy.episodes.create, onClick: onCreate }}
          />
        ) : (
          <div className="cell-list">
            {recent.map((episode) => (
              <button
                key={episode.id}
                type="button"
                className="cell"
                onClick={() => onOpenEpisode(episode.id)}
              >
                <span className="cell-main">
                  <strong>{episode.title}</strong>
                  <span className="cell-sub">{episode.synopsis?.trim() || 'No synopsis yet.'}</span>
                </span>
                <span className="cell-side">
                  <StatusTag status={episode.status} />
                  <time dateTime={episode.updatedAt}>{formatDateTime(episode.updatedAt)}</time>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <button type="button" className="fab" onClick={onCreate} aria-label={copy.episodes.create}>
        +
      </button>
    </div>
  );
}
