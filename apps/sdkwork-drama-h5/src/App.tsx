import type { Episode } from '@sdkwork/drama-app-sdk';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useIamAccount } from './account/use-iam-account';
import type { AppRuntime } from './composition/runtimeServices';
import { AccountScreen } from './components/AccountScreen';
import { AuthScreen } from './components/AuthScreen';
import { ConfirmSheet, type ConfirmRequest } from './components/ConfirmSheet';
import { CreateScreen } from './components/CreateScreen';
import { DetailScreen } from './components/DetailScreen';
import { EpisodesScreen } from './components/EpisodesScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { TabBar, type TabId } from './components/TabBar';
import { Toast, type ToastMessage } from './components/Toast';
import { copy } from './i18n';
import type { EpisodeDraftInput } from './services/episode-service';
import { validateMediaFile, type MediaKind } from './services/media-service';
import { normalizeProblem, type NormalizedProblem } from './services/problem';
import { useEpisodes } from './state/use-episodes';
import { useMediaAssets } from './state/use-media-assets';

export default function App({ runtime }: { readonly runtime: AppRuntime }) {
  const account = useIamAccount(runtime.services?.iam ?? null);
  const episodes = useEpisodes(runtime.services?.episodes ?? null);
  const initialParams = new URLSearchParams(window.location.search);
  const initialScreen = initialParams.get('screen');
  const initialTab: TabId = initialScreen === 'episodes' || initialScreen === 'account'
    ? initialScreen
    : 'overview';
  const [tab, setTab] = useState<TabId>(initialTab);
  const [detailId, setDetailId] = useState<string | null>(() => initialParams.get('episode'));
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mutationError, setMutationError] = useState<NormalizedProblem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const media = useMediaAssets(runtime.services?.media ?? null, detailId);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const detailEpisode = useMemo(
    () => episodes.items.find((episode) => episode.id === detailId) ?? null,
    [episodes.items, detailId],
  );

  const screenKey = creating ? 'create' : detailId ? 'detail' : tab;

  useEffect(() => {
    canvasRef.current?.scrollTo({ top: 0 });
  }, [screenKey]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('screen', detailId ? 'detail' : creating ? 'create' : tab);
    if (detailId) url.searchParams.set('episode', detailId);
    else url.searchParams.delete('episode');
    window.history.replaceState({}, '', url);
  }, [tab, detailId, creating]);

  useEffect(() => {
    if (detailId !== null && detailEpisode === null && !episodes.loading) {
      setDetailId(null);
      setTab('episodes');
    }
  }, [detailId, detailEpisode, episodes.loading]);

  const tabVisible = !creating && detailId === null;

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
        setCreating(false);
        setTab('episodes');
        setDetailId(episode.id);
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
            setDetailId(null);
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
    void service
      .upload(episode.id, kind, file)
      .then((asset) => {
        media.add(asset);
        succeed(`“${asset.fileName}” uploaded.`);
      })
      .catch(fail)
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
      <div className="app-frame">
        <div className="blank-screen">
          <span className="auth-mark" aria-hidden="true">SD</span>
          <h1>{copy.common.notConfigured}</h1>
          <p>{copy.common.notConfiguredHint}</p>
        </div>
      </div>
    );
  }

  if (account.loading && account.snapshot.status === 'anonymous' && !account.selection) {
    return (
      <div className="app-frame">
        <div className="blank-screen" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>{copy.auth.loading}</p>
        </div>
      </div>
    );
  }

  if (account.snapshot.status !== 'authenticated' || account.selection) {
    return (
      <div className="app-frame">
        <div className="app-canvas" ref={canvasRef}>
          <AuthScreen account={account} runtimeConfigured />
        </div>
      </div>
    );
  }

  return (
    <div className="app-frame">
      <div className="app-canvas" data-tabbar={tabVisible ? 'true' : 'false'} ref={canvasRef}>
        {creating ? (
          <CreateScreen
            busy={busy}
            error={mutationError}
            onBack={() => {
              if (busy) return;
              setCreating(false);
              setMutationError(null);
            }}
            onSubmit={createEpisode}
          />
        ) : detailEpisode ? (
          <DetailScreen
            episode={detailEpisode}
            busy={busy}
            mediaBusy={mediaBusy}
            media={media}
            onBack={() => {
              setDetailId(null);
              setMutationError(null);
            }}
            onSave={(draft) => saveEpisode(detailEpisode, draft)}
            onPublish={() => requestPublish(detailEpisode)}
            onDelete={() => requestDelete(detailEpisode)}
            onUpload={(kind, file) => uploadMedia(detailEpisode, kind, file)}
            onValidate={validateMedia}
          />
        ) : tab === 'overview' ? (
          <OverviewScreen
            episodes={episodes.items}
            onCreate={() => {
              setMutationError(null);
              setCreating(true);
            }}
            onOpenEpisodes={() => setTab('episodes')}
            onOpenEpisode={(episodeId) => setDetailId(episodeId)}
          />
        ) : tab === 'episodes' ? (
          <EpisodesScreen
            episodes={episodes.items}
            loading={episodes.loading}
            loadingMore={episodes.loadingMore}
            hasMore={episodes.hasMore}
            error={episodes.error}
            onCreate={() => {
              setMutationError(null);
              setCreating(true);
            }}
            onOpen={(episodeId) => {
              setMutationError(null);
              setDetailId(episodeId);
            }}
            onRefresh={() => void episodes.refresh()}
            onLoadMore={() => void episodes.loadMore()}
          />
        ) : (
          <AccountScreen account={account} />
        )}
      </div>

      {tabVisible ? (
        <TabBar
          active={tab}
          onChange={(next) => {
            setTab(next);
            setMutationError(null);
          }}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
      <ConfirmSheet request={confirm} onCancel={() => setConfirm(null)} />

      {mutationError && (detailId !== null || creating) && !confirm ? (
        <div className="floating-error" role="alert">
          <span>{mutationError.detail}</span>
          <button type="button" className="btn" onClick={() => setMutationError(null)}>
            {copy.common.dismiss}
          </button>
        </div>
      ) : null}
    </div>
  );
}
