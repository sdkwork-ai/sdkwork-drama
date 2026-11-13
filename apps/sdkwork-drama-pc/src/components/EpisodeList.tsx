import { useMemo, useState } from 'react';
import type { Episode, EpisodeStatus } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import { formatDateTime } from '../services/format';
import type { NormalizedProblem } from '../services/problem';
import { EmptyState } from './EmptyState';
import { ErrorPanel } from './ErrorPanel';
import { StatusBadge } from './StatusBadge';

type StatusFilter = 'all' | EpisodeStatus;

const FILTERS: readonly { readonly id: StatusFilter; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'retired', label: 'Retired' },
];

export function EpisodeList({
  episodes,
  selectedId,
  loading,
  loadingMore,
  hasMore,
  error,
  onSelect,
  onRefresh,
  onLoadMore,
  onCreate,
}: {
  readonly episodes: readonly Episode[];
  readonly selectedId: string | null;
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly hasMore: boolean;
  readonly error: NormalizedProblem | null;
  readonly onSelect: (episodeId: string) => void;
  readonly onRefresh: () => void;
  readonly onLoadMore: () => void;
  readonly onCreate: () => void;
}) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const visible = useMemo(
    () => (filter === 'all' ? episodes : episodes.filter((episode) => episode.status === filter)),
    [episodes, filter],
  );

  return (
    <section className="panel episode-list-panel" aria-label={copy.episodes.title}>
      <div className="panel-head">
        <div>
          <h2>Episode catalogue</h2>
          <p>{copy.episodes.subtitle}</p>
        </div>
        <div className="panel-actions">
          <button type="button" className="button" onClick={onRefresh} disabled={loading}>
            {copy.episodes.refresh}
          </button>
        </div>
      </div>

      <div className="filter-chips" role="group" aria-label="Filter by status">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip"
            data-active={filter === item.id ? 'true' : 'false'}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <ErrorPanel problem={error} onRetry={onRefresh} /> : null}

      {loading && episodes.length === 0 ? (
        <div className="skeleton-list" aria-label={copy.common.loading}>
          {[0, 1, 2, 3].map((row) => (
            <span className="skeleton-row" key={row} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={copy.episodes.empty}
          hint={copy.episodes.emptyHint}
          action={{ label: copy.episodes.create, onClick: onCreate }}
        />
      ) : (
        <ul className="episode-rows">
          {visible.map((episode) => (
            <li key={episode.id}>
              <button
                type="button"
                className="episode-row"
                data-selected={selectedId === episode.id ? 'true' : 'false'}
                aria-current={selectedId === episode.id ? 'true' : undefined}
                onClick={() => onSelect(episode.id)}
              >
                <span className="episode-row-main">
                  <strong>{episode.title}</strong>
                  <span className="episode-row-synopsis">
                    {episode.synopsis?.trim() || 'No synopsis yet.'}
                  </span>
                </span>
                <span className="episode-row-meta">
                  <StatusBadge status={episode.status} />
                  <time dateTime={episode.updatedAt}>{formatDateTime(episode.updatedAt)}</time>
                  <code>{episode.id}</code>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <button type="button" className="button load-more" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? copy.episodes.loadingMore : copy.episodes.loadMore}
        </button>
      ) : null}
    </section>
  );
}
