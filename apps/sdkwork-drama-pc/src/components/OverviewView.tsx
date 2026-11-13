import type { Episode } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import { formatDateTime, statusLabel } from '../services/format';
import { statusCounts } from '../services/episode-service';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';

export function OverviewView({
  episodes,
  onCreate,
  onOpenEpisodes,
  onSelect,
}: {
  readonly episodes: readonly Episode[];
  readonly onCreate: () => void;
  readonly onOpenEpisodes: () => void;
  readonly onSelect: (episodeId: string) => void;
}) {
  const counts = statusCounts(episodes);
  const recent = episodes.slice(0, 6);

  return (
    <div className="overview">
      <section className="stat-grid" aria-label="Episode pipeline">
        <article className="stat">
          <span>{copy.overview.total}</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="stat">
          <span>{copy.overview.drafts}</span>
          <strong>{counts.draft}</strong>
        </article>
        <article className="stat">
          <span>{copy.overview.published}</span>
          <strong>{counts.published}</strong>
        </article>
        <article className="stat">
          <span>{copy.overview.retired}</span>
          <strong>{counts.retired}</strong>
        </article>
      </section>

      <section className="panel" aria-label={copy.overview.recent}>
        <div className="panel-head">
          <div>
            <h2>{copy.overview.recent}</h2>
            <p>{copy.overview.subtitle}</p>
          </div>
          <div className="panel-actions">
            <button type="button" className="button" onClick={onOpenEpisodes}>
              {copy.nav.episodes}
            </button>
            <button type="button" className="button" data-tone="primary" onClick={onCreate}>
              {copy.episodes.create}
            </button>
          </div>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title={copy.overview.empty}
            hint={copy.episodes.emptyHint}
            action={{ label: copy.episodes.create, onClick: onCreate }}
          />
        ) : (
          <ul className="recent-rows">
            {recent.map((episode) => (
              <li key={episode.id}>
                <button
                  type="button"
                  className="recent-row"
                  onClick={() => {
                    onSelect(episode.id);
                    onOpenEpisodes();
                  }}
                >
                  <span>
                    <strong>{episode.title}</strong>
                    <span>{episode.synopsis?.trim() || 'No synopsis yet.'}</span>
                  </span>
                  <StatusBadge status={episode.status} />
                  <time dateTime={episode.updatedAt}>{formatDateTime(episode.updatedAt)}</time>
                  <span className="recent-open">{copy.overview.open} →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pipeline-note" aria-label="Publishing pipeline">
        <p className="eyebrow">Pipeline</p>
        <h2>{copy.overview.title}</h2>
        <ol className="pipeline">
          <li><strong>{statusLabel('draft')}</strong><span>Author metadata and upload assets.</span></li>
          <li><strong>{statusLabel('published')}</strong><span>Publish when the episode is ready.</span></li>
          <li><strong>{statusLabel('retired')}</strong><span>Retired titles stay readable through the API.</span></li>
        </ol>
      </section>
    </div>
  );
}
