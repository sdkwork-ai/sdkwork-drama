import { useRef, useState } from 'react';
import type { Episode, MediaAsset } from '@sdkwork/drama-app-sdk';

import { copy } from '../i18n';
import type { EpisodeDraftInput } from '../services/episode-service';
import { formatBytes, formatDateTime, mediaKindLabel } from '../services/format';
import { MEDIA_KIND_ACCEPT, MEDIA_KIND_LABELS, type MediaKind } from '../services/media-service';
import type { NormalizedProblem } from '../services/problem';
import { BottomSheetPicker, usePickerState } from './BottomSheetPicker';
import { ErrorBanner, SkeletonRows, StatusTag } from './common';
import { NavBar } from './NavBar';

const KINDS: readonly MediaKind[] = ['cover', 'video', 'audio', 'subtitle'];

export function DetailScreen({
  episode,
  busy,
  mediaBusy,
  media,
  onBack,
  onSave,
  onPublish,
  onDelete,
  onUpload,
  onValidate,
}: {
  readonly episode: Episode;
  readonly busy: boolean;
  readonly mediaBusy: boolean;
  readonly media: {
    readonly items: readonly MediaAsset[];
    readonly loading: boolean;
    readonly error: NormalizedProblem | null;
    readonly refresh: () => Promise<void>;
  };
  readonly onBack: () => void;
  readonly onSave: (draft: EpisodeDraftInput) => void;
  readonly onPublish: () => void;
  readonly onDelete: () => void;
  readonly onUpload: (kind: MediaKind, file: File) => void;
  readonly onValidate: (kind: MediaKind, file: File) => string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(episode.title);
  const [synopsis, setSynopsis] = useState(episode.synopsis ?? '');
  const [validation, setValidation] = useState('');
  const [kind, setKind] = useState<MediaKind>('cover');
  const [uploadError, setUploadError] = useState('');
  const picker = usePickerState();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const publishable = episode.status === 'draft';

  const beginEdit = () => {
    setTitle(episode.title);
    setSynopsis(episode.synopsis ?? '');
    setValidation('');
    setEditing(true);
  };

  const save = () => {
    if (title.trim().length === 0) {
      setValidation(copy.editor.validationTitle);
      return;
    }
    setValidation('');
    onSave({ title, synopsis });
    setEditing(false);
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const problem = onValidate(kind, file);
    if (problem) {
      setUploadError(problem);
      return;
    }
    setUploadError('');
    onUpload(kind, file);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="screen">
      <NavBar title={copy.episodes.title} onBack={onBack} />

      <section className="surface detail-hero">
        <div className="detail-hero-top">
          <StatusTag status={episode.status} />
          <span>Updated {formatDateTime(episode.updatedAt)}</span>
        </div>
        <h2>{episode.title}</h2>
        <p>{episode.synopsis?.trim() || 'No synopsis yet.'}</p>
        <code>{episode.id}</code>
      </section>

      <section className="surface" aria-label={copy.editor.title}>
        <div className="section-head">
          <h2>{copy.editor.title}</h2>
          {editing ? (
            <button type="button" className="text-button" onClick={() => setEditing(false)}>
              {copy.editor.cancel}
            </button>
          ) : (
            <button type="button" className="text-button" onClick={beginEdit}>
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="field-stack">
            <label className="field">
              <span>{copy.editor.titleLabel}</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                disabled={busy}
                required
              />
            </label>
            <label className="field">
              <span>{copy.editor.synopsisLabel}</span>
              <textarea
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                rows={5}
                maxLength={2000}
                disabled={busy}
              />
            </label>
            {validation ? <p className="form-error" role="alert">{validation}</p> : null}
            <div className="button-row">
              <button type="button" className="btn" onClick={() => setEditing(false)} disabled={busy}>
                {copy.editor.cancel}
              </button>
              <button type="button" className="btn" data-tone="primary" onClick={save} disabled={busy}>
                {busy ? copy.editor.saving : copy.editor.save}
              </button>
            </div>
          </div>
        ) : (
          <dl className="fact-list">
            <div>
              <dt>Status</dt>
              <dd>{episode.status}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(episode.createdAt)}</dd>
            </div>
            <div>
              <dt>Tenant</dt>
              <dd><code>{episode.tenantId}</code></dd>
            </div>
          </dl>
        )}
      </section>

      <section className="surface" aria-label="Episode actions">
        <div className="button-row">
          <button
            type="button"
            className="btn"
            data-tone="primary"
            onClick={onPublish}
            disabled={busy || !publishable}
          >
            {busy ? copy.editor.publishing : copy.editor.publish}
          </button>
          <button
            type="button"
            className="btn"
            data-tone="danger"
            onClick={onDelete}
            disabled={busy}
          >
            {copy.editor.delete}
          </button>
        </div>
        <p className="hint">{publishable ? copy.editor.publishHint : 'Published and retired episodes cannot be re-published.'}</p>
      </section>

      <section className="surface" aria-label={copy.media.title}>
        <div className="section-head">
          <h2>{copy.media.title}</h2>
          <button type="button" className="text-button" onClick={() => void media.refresh()} disabled={media.loading}>
            Refresh
          </button>
        </div>

        <div className="uploader">
          <button type="button" className="picker-cell" onClick={picker.show} disabled={mediaBusy}>
            <span>{copy.media.kind}</span>
            <span className="picker-value">
              {MEDIA_KIND_LABELS[kind]}
              <span aria-hidden="true">›</span>
            </span>
          </button>
          <label className="file-cell">
            <span>{mediaBusy ? copy.media.uploading : copy.media.chooseFile}</span>
            <input
              ref={fileInput}
              type="file"
              accept={MEDIA_KIND_ACCEPT[kind]}
              disabled={mediaBusy}
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
          </label>
          <p className="hint">{copy.media.limitHint}</p>
        </div>

        {uploadError ? <p className="form-error" role="alert">{uploadError}</p> : null}
        {media.error ? <ErrorBanner problem={media.error} onRetry={() => void media.refresh()} /> : null}

        {media.loading && media.items.length === 0 ? (
          <SkeletonRows rows={3} />
        ) : media.items.length === 0 ? (
          <p className="empty-line">{copy.media.empty} {copy.media.emptyHint}</p>
        ) : (
          <div className="cell-list">
            {media.items.map((asset) => (
              <div className="cell" key={asset.id}>
                <span className="cell-main">
                  <strong>{mediaKindLabel(asset.kind)} · {asset.fileName}</strong>
                  <span className="cell-sub">{formatBytes(asset.contentLength)} · {formatDateTime(asset.createdAt)}</span>
                  <code>{asset.driveUri}</code>
                </span>
                <span className="cell-side">
                  <span className="status-tag">{asset.status}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {picker.open ? (
        <BottomSheetPicker
          title={copy.media.kind}
          options={KINDS.map((item) => ({ id: item, label: MEDIA_KIND_LABELS[item] }))}
          selectedId={kind}
          onSelect={(id) => setKind(id as MediaKind)}
          onClose={picker.hide}
        />
      ) : null}
    </div>
  );
}
