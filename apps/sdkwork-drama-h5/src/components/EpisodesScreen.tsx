import { useMemo, useState } from 'react';
import type { Episode, EpisodeStatus } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import { formatDateTime } from '../services/format';
import type { NormalizedProblem } from '../services/problem';
import { EmptyBlock, ErrorBanner, SkeletonRows, StatusTag } from './common';

type StatusFilter = 'all' | EpisodeStatus;

const FILTERS: readonly { readonly id: StatusFilter; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'retired', label: 'Retired' },
];

export function EpisodesScreen({
  episodes,
  loading,
  loadingMore,
  hasMore,
  error,
  onCreate,
  onOpen,
  onRefresh,
  onLoadMore,
}: {
  readonly episodes: readonly Episode[];
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly hasMore: boolean;
  readonly error: NormalizedProblem | null;
  readonly onCreate: () => void;
  readonly onOpen: (episodeId: string) => void;
  readonly onRefresh: () => void;
  readonly onLoadMore: () => void;
}) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const visible = useMemo(
    () => (filter === 'all' ? episodes : episodes.filter((episode) => episode.status === filter)),
    [episodes, filter],
  );

  return (
    <div className="screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">{copy.app.tagline}</p>
          <h1>{copy.episodes.title}</h1>
        </div>
        <button type="button" className="text-button" onClick={onRefresh} disabled={loading}>
          Refresh
        </button>
      </header>

      <div className="filter-row" role="group" aria-label="Filter by status">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="filter-chip"
            data-active={filter === item.id ? 'true' : 'false'}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <ErrorBanner problem={error} onRetry={onRefresh} /> : null}

      {loading && episodes.length === 0 ? (
        <SkeletonRows rows={5} />
      ) : visible.length === 0 ? (
        <EmptyBlock
          title={copy.episodes.empty}
          hint={copy.episodes.emptyHint}
          action={{ label: copy.episodes.create, onClick: onCreate }}
        />
      ) : (
        <div className="cell-list">
          {visible.map((episode) => (
            <button
              key={episode.id}
              type="button"
              className="cell"
              onClick={() => onOpen(episode.id)}
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
          {hasMore ? (
            <button type="button" className="load-more" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? copy.episodes.loadingMore : copy.episodes.loadMore}
            </button>
          ) : null}
        </div>
      )}

      <button type="button" className="fab" onClick={onCreate} aria-label={copy.episodes.create}>
        +
      </button>
    </div>
  );
}
