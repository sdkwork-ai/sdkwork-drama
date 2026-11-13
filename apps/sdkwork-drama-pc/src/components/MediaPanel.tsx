import { useRef, useState } from 'react';
import type { MediaAsset } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import { formatBytes, formatDateTime, mediaKindLabel } from '../services/format';
import {
  MEDIA_KIND_ACCEPT,
  MEDIA_KIND_LABELS,
  type MediaKind,
  type MediaService,
} from '../services/media-service';
import type { NormalizedProblem } from '../services/problem';
import { EmptyState } from './EmptyState';
import { ErrorPanel } from './ErrorPanel';

const KINDS: readonly MediaKind[] = ['cover', 'video', 'audio', 'subtitle'];

export function MediaPanel({
  assets,
  loading,
  error,
  busy,
  onUpload,
  onRefresh,
  onValidate,
}: {
  readonly assets: readonly MediaAsset[];
  readonly loading: boolean;
  readonly error: NormalizedProblem | null;
  readonly busy: boolean;
  readonly onUpload: (kind: MediaKind, file: File) => void;
  readonly onRefresh: () => void;
  readonly onValidate: (kind: MediaKind, file: File) => string | null;
}) {
  const [kind, setKind] = useState<MediaKind>('cover');
  const [validation, setValidation] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const problem = onValidate(kind, file);
    if (problem) {
      setValidation(problem);
      return;
    }
    setValidation('');
    onUpload(kind, file);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <section className="panel media-panel" aria-label={copy.media.title}>
      <div className="panel-head">
        <div>
          <h2>{copy.media.title}</h2>
          <p>{copy.media.subtitle}</p>
        </div>
        <button type="button" className="button" onClick={onRefresh} disabled={loading || busy}>
          {copy.episodes.refresh}
        </button>
      </div>

      <div className="uploader">
        <label className="uploader-kind">
          <span>{copy.media.kind}</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as MediaKind)}
            disabled={busy}
          >
            {KINDS.map((item) => (
              <option key={item} value={item}>
                {MEDIA_KIND_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="uploader-file">
          <span>{copy.media.chooseFile}</span>
          <input
            ref={fileInput}
            type="file"
            accept={MEDIA_KIND_ACCEPT[kind]}
            disabled={busy}
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
        </label>
        <span className="uploader-hint">{copy.media.limitHint}</span>
      </div>

      {validation ? <p className="form-error" role="alert">{validation}</p> : null}
      {error ? <ErrorPanel problem={error} onRetry={onRefresh} /> : null}

      {loading && assets.length === 0 ? (
        <div className="skeleton-list" aria-label={copy.common.loading}>
          {[0, 1, 2].map((row) => (
            <span className="skeleton-row" key={row} />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState title={copy.media.empty} hint={copy.media.emptyHint} />
      ) : (
        <table className="asset-table">
          <thead>
            <tr>
              <th scope="col">{copy.media.columns.kind}</th>
              <th scope="col">{copy.media.columns.file}</th>
              <th scope="col">{copy.media.columns.size}</th>
              <th scope="col">{copy.media.columns.status}</th>
              <th scope="col">{copy.media.columns.created}</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>{mediaKindLabel(asset.kind)}</td>
                <td>
                  <strong>{asset.fileName}</strong>
                  <code>{asset.driveUri}</code>
                </td>
                <td>{formatBytes(asset.contentLength)}</td>
                <td>
                  <span className="status-badge" data-status={asset.status}>{asset.status}</span>
                </td>
                <td>{formatDateTime(asset.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export type { MediaService };
