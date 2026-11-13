import type { Episode, MediaAsset } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import { formatDateTime } from '../services/format';
import { type MediaKind } from '../services/media-service';
import type { NormalizedProblem } from '../services/problem';
import { EmptyState } from './EmptyState';
import { MediaPanel } from './MediaPanel';
import { StatusBadge } from './StatusBadge';

export function EpisodeDetail({
  episode,
  busy,
  media,
  mediaBusy,
  onEdit,
  onPublish,
  onDelete,
  onUpload,
  onRefreshMedia,
  onValidateMedia,
}: {
  readonly episode: Episode | null;
  readonly busy: boolean;
  readonly media: {
    readonly items: readonly MediaAsset[];
    readonly loading: boolean;
    readonly error: NormalizedProblem | null;
    readonly refresh: () => Promise<void>;
  };
  readonly mediaBusy: boolean;
  readonly onEdit: () => void;
  readonly onPublish: () => void;
  readonly onDelete: () => void;
  readonly onUpload: (kind: MediaKind, file: File) => void;
  readonly onRefreshMedia: () => Promise<void>;
  readonly onValidateMedia: (kind: MediaKind, file: File) => string | null;
}) {
  if (!episode) {
    return (
      <section className="panel episode-detail-panel">
        <EmptyState title={copy.episodes.selectHint} hint={copy.episodes.emptyHint} />
      </section>
    );
  }

  const publishable = episode.status === 'draft';

  return (
    <div className="episode-detail">
      <section className="panel episode-detail-panel" aria-label={copy.editor.title}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">{episode.id}</p>
            <h2>{episode.title}</h2>
            <div className="detail-meta">
              <StatusBadge status={episode.status} />
              <span>Updated {formatDateTime(episode.updatedAt)}</span>
              <span>Created {formatDateTime(episode.createdAt)}</span>
            </div>
          </div>
          <div className="panel-actions">
            <button type="button" className="button" onClick={onEdit} disabled={busy}>
              Edit
            </button>
            <button
              type="button"
              className="button"
              data-tone="primary"
              onClick={onPublish}
              disabled={busy || !publishable}
              title={publishable ? copy.editor.publishHint : 'Only drafts can be published.'}
            >
              {copy.editor.publish}
            </button>
            <button
              type="button"
              className="button"
              data-tone="danger"
              onClick={onDelete}
              disabled={busy}
            >
              {copy.editor.delete}
            </button>
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-synopsis">
            <span className="field-label">{copy.editor.synopsisLabel}</span>
            <p>{episode.synopsis?.trim() || 'No synopsis yet.'}</p>
          </div>
          <div className="detail-facts">
            <div><span>Status</span><strong>{episode.status}</strong></div>
            <div><span>Tenant</span><strong>{episode.tenantId}</strong></div>
            <div><span>Episode ID</span><strong><code>{episode.id}</code></strong></div>
          </div>
        </div>
      </section>

      <MediaPanel
        assets={media.items}
        loading={media.loading}
        error={media.error}
        busy={mediaBusy}
        onUpload={onUpload}
        onRefresh={() => void onRefreshMedia()}
        onValidate={onValidateMedia}
      />
    </div>
  );
}
