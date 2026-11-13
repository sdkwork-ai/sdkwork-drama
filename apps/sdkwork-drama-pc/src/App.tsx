import type { Episode } from '@sdkwork/drama-app-sdk';
import { useEffect, useMemo, useState } from 'react';

import { useIamAccount } from './account/use-iam-account';
import type { AppRuntime } from './composition/runtimeServices';
import { AccountView } from './components/AccountView';
import { AuthGate } from './components/AuthGate';
import { ConfirmDialog, type ConfirmRequest } from './components/ConfirmDialog';
import { EpisodeDetail } from './components/EpisodeDetail';
import { EpisodeForm } from './components/EpisodeForm';
import { EpisodeList } from './components/EpisodeList';
import { OverviewView } from './components/OverviewView';
import { Rail, type RailView } from './components/Rail';
import { Toast, type ToastMessage } from './components/Toast';
import { copy } from './i18n';
import type { EpisodeDraftInput } from './services/episode-service';
import { validateMediaFile, type MediaKind } from './services/media-service';
import { normalizeProblem, type NormalizedProblem } from './services/problem';
import { useEpisodes } from './state/use-episodes';
import { useMediaAssets } from './state/use-media-assets';

type Dialog = { readonly kind: 'create' } | { readonly kind: 'edit'; readonly episode: Episode } | null;

const viewCopy: Record<RailView, { readonly title: string; readonly subtitle: string }> = {
  overview: { title: copy.overview.title, subtitle: copy.overview.subtitle },
  episodes: { title: copy.episodes.title, subtitle: copy.episodes.subtitle },
  account: { title: copy.account.title, subtitle: copy.account.subtitle },
};

function initialView(): RailView {
  const view = new URLSearchParams(window.location.search).get('view');
  return view === 'episodes' || view === 'account' ? view : 'overview';
}

function initialEpisodeId(): string | null {
  return new URLSearchParams(window.location.search).get('episode');
}

export default function App({ runtime }: { readonly runtime: AppRuntime }) {
  const account = useIamAccount(runtime.services?.iam ?? null);
  const episodes = useEpisodes(runtime.services?.episodes ?? null);
  const [view, setView] = useState<RailView>(initialView);
  const [selectedId, setSelectedId] = useState<string | null>(initialEpisodeId);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState<NormalizedProblem | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<NormalizedProblem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const media = useMediaAssets(runtime.services?.media ?? null, selectedId);

  const selected = useMemo(
    () => episodes.items.find((episode) => episode.id === selectedId) ?? null,
    [episodes.items, selectedId],
  );

  useEffect(() => {
    if (selectedId === null && episodes.items.length > 0) {
      setSelectedId(episodes.items[0]?.id ?? null);
    }
  }, [episodes.items, selectedId]);

  useEffect(() => {
    if (selectedId !== null && selected === null && !episodes.loading) {
      setSelectedId(episodes.items[0]?.id ?? null);
    }
  }, [selected, selectedId, episodes.loading, episodes.items]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    if (view === 'episodes' && selectedId) {
      url.searchParams.set('episode', selectedId);
    } else {
      url.searchParams.delete('episode');
    }
    window.history.replaceState({}, '', url);
  }, [view, selectedId]);

  const displayName = account.snapshot.status === 'authenticated'
    ? (account.snapshot.profile.displayName?.trim()
      || account.snapshot.profile.email?.trim()
      || 'Studio user')
    : 'Studio';

  const succeed = (message: string) => setToast({ tone: 'success', text: message });

  const fail = (failure: unknown) => {
    const problem = normalizeProblem(failure);
    setMutationError(problem);
    setToast({ tone: 'error', text: problem.detail });
  };

  const createEpisode = (draft: EpisodeDraftInput) => {
    const service = runtime.services?.episodes;
    if (!service) return;
    setBusy(true);
    setMutationError(null);
    void service
      .create(draft)
      .then((episode) => {
        episodes.upsert(episode);
        setSelectedId(episode.id);
        setDialog(null);
        setView('episodes');
        succeed(`Draft “${episode.title}” created.`);
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const saveEpisode = (episode: Episode, draft: EpisodeDraftInput) => {
    const service = runtime.services?.episodes;
    if (!service) return;
    setBusy(true);
    setMutationError(null);
    void service
      .update(episode.id, draft)
      .then((updated) => {
        episodes.upsert(updated);
        setDialog(null);
        succeed('Episode metadata saved.');
      })
      .catch(fail)
      .finally(() => setBusy(false));
  };

  const requestPublish = (episode: Episode) => {
    setConfirm({
      title: copy.editor.publish,
      body: copy.editor.publishConfirm,
      confirmLabel: copy.editor.publish,
      onConfirm: () => {
        const service = runtime.services?.episodes;
        if (!service) return;
        setBusy(true);
        setMutationError(null);
        void service
          .publish(episode.id)
          .then((updated) => {
            episodes.upsert(updated);
            succeed(`“${updated.title}” published.`);
          })
          .catch(fail)
          .finally(() => setBusy(false));
      },
    });
  };

  const requestDelete = (episode: Episode) => {
    setConfirm({
      title: copy.editor.delete,
      body: copy.editor.deleteConfirm,
      confirmLabel: copy.editor.delete,
      tone: 'danger',
      onConfirm: () => {
        const service = runtime.services?.episodes;
        if (!service) return;
        setBusy(true);
        setMutationError(null);
        void service
          .remove(episode.id)
          .then(() => {
            episodes.remove(episode.id);
            succeed(`“${episode.title}” deleted.`);
          })
          .catch(fail)
          .finally(() => setBusy(false));
      },
    });
  };

  const uploadMedia = (episode: Episode, kind: MediaKind, file: File) => {
    const service = runtime.services?.media;
    if (!service) return;
    setMediaBusy(true);
    setMediaUploadError(null);
    void service
      .upload(episode.id, kind, file)
      .then((asset) => {
        media.add(asset);
        succeed(`${asset.fileName} uploaded as ${asset.kind}.`);
      })
      .catch((failure) => {
        const problem = normalizeProblem(failure);
        setMediaUploadError(problem);
        setToast({ tone: 'error', text: problem.detail });
      })
      .finally(() => setMediaBusy(false));
  };

  const validateMedia = (kind: MediaKind, file: File): string | null => {
    try {
      validateMediaFile(kind, file.name, file.type, file.size);
      return null;
    } catch (failure) {
      return failure instanceof Error ? failure.message : 'The selected file is not valid.';
    }
  };

  if (!runtime.services) {
    return (
      <div className="blank-state">
        <span className="auth-mark" aria-hidden="true">SD</span>
        <h1>{copy.common.notConfigured}</h1>
        <p>{copy.common.notConfiguredHint}</p>
        <code>GET /runtime-env.json</code>
      </div>
    );
  }

  if (account.loading && account.snapshot.status === 'anonymous' && !account.selection) {
    return (
      <div className="blank-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <p>{copy.auth.loading}</p>
      </div>
    );
  }

  if (account.snapshot.status !== 'authenticated' || account.selection) {
    return <AuthGate account={account} runtimeConfigured />;
  }

  const header = viewCopy[view];

  return (
    <div className="studio">
      <Rail
        view={view}
        displayName={displayName}
        onChange={(next) => {
          setView(next);
          if (next !== 'episodes') setMutationError(null);
        }}
      />

      <div className="studio-body">
        <header className="topbar">
          <div>
            <p className="eyebrow">SDKWork Drama</p>
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <span className="account-chip">
              <span className="account-chip-avatar" aria-hidden="true">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
              {displayName}
            </span>
            <button
              type="button"
              className="button"
              data-tone="primary"
              onClick={() => setDialog({ kind: 'create' })}
            >
              {copy.episodes.create}
            </button>
          </div>
        </header>

        <main className="studio-canvas">
          {mutationError ? (
            <div className="inline-error" role="alert">
              <span>{mutationError.detail}</span>
              <button
                type="button"
                className="button"
                onClick={() => setMutationError(null)}
              >
                {copy.common.dismiss}
              </button>
            </div>
          ) : null}

          {view === 'overview' ? (
            <OverviewView
              episodes={episodes.items}
              onCreate={() => setDialog({ kind: 'create' })}
              onOpenEpisodes={() => setView('episodes')}
              onSelect={setSelectedId}
            />
          ) : null}

          {view === 'episodes' ? (
            <div className="episodes-layout">
              <EpisodeList
                episodes={episodes.items}
                selectedId={selectedId}
                loading={episodes.loading}
                loadingMore={episodes.loadingMore}
                hasMore={episodes.hasMore}
                error={episodes.error}
                onSelect={setSelectedId}
                onRefresh={() => void episodes.refresh()}
                onLoadMore={() => void episodes.loadMore()}
                onCreate={() => setDialog({ kind: 'create' })}
              />
              <EpisodeDetail
                episode={selected}
                busy={busy}
                media={media}
                mediaBusy={mediaBusy}
                onEdit={() => {
                  if (selected) setDialog({ kind: 'edit', episode: selected });
                }}
                onPublish={() => {
                  if (selected) requestPublish(selected);
                }}
                onDelete={() => {
                  if (selected) requestDelete(selected);
                }}
                onUpload={(kind, file) => {
                  if (selected) uploadMedia(selected, kind, file);
                }}
                onRefreshMedia={async () => {
                  await media.refresh();
                }}
                onValidateMedia={validateMedia}
              />
            </div>
          ) : null}

          {view === 'account' ? <AccountView account={account} /> : null}
        </main>
      </div>

      {dialog ? (
        <EpisodeForm
          mode={dialog.kind === 'create' ? 'create' : 'edit'}
          initial={
            dialog.kind === 'edit'
              ? { title: dialog.episode.title, synopsis: dialog.episode.synopsis ?? '' }
              : { title: '', synopsis: '' }
          }
          busy={busy}
          error={dialog.kind === 'edit' ? mutationError : null}
          onCancel={() => {
            if (busy) return;
            setDialog(null);
            setMutationError(null);
          }}
          onSubmit={(draft) => {
            if (dialog.kind === 'create') createEpisode(draft);
            else saveEpisode(dialog.episode, draft);
          }}
        />
      ) : null}

      <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {mediaUploadError ? (
        <div className="inline-error floating" role="status">
          <span>{mediaUploadError.detail}</span>
          <button
            type="button"
            className="button"
            onClick={() => setMediaUploadError(null)}
          >
            {copy.common.dismiss}
          </button>
        </div>
      ) : null}
    </div>
  );
}
