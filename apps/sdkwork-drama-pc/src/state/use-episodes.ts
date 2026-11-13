import type { Episode } from '@sdkwork/drama-app-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { EpisodeService } from '../services/episode-service';
import { normalizeProblem, type NormalizedProblem } from '../services/problem';

export interface EpisodesState {
  readonly items: readonly Episode[];
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly hasMore: boolean;
  readonly error: NormalizedProblem | null;
  readonly refresh: () => Promise<void>;
  readonly loadMore: () => Promise<void>;
  readonly upsert: (episode: Episode) => void;
  readonly remove: (episodeId: string) => void;
}

function mergeEpisodes(current: readonly Episode[], incoming: readonly Episode[]): Episode[] {
  const byId = new Map<string, Episode>();
  for (const episode of [...current, ...incoming]) {
    byId.set(episode.id, episode);
  }
  return [...byId.values()];
}

export function useEpisodes(service: EpisodeService | null): EpisodesState {
  const [items, setItems] = useState<readonly Episode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(Boolean(service));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<NormalizedProblem | null>(null);
  const requestId = useRef(0);

  const loadFirstPage = useCallback(async () => {
    if (!service) return;
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError(null);
    try {
      const page = await service.list();
      if (requestId.current !== id) return;
      setItems(page.items);
      setNextCursor(page.pageInfo.nextCursor ?? null);
      setHasMore(page.pageInfo.hasMore ?? Boolean(page.pageInfo.nextCursor));
    } catch (failure) {
      if (requestId.current === id) setError(normalizeProblem(failure));
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!service || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await service.list(nextCursor);
      setItems((current) => mergeEpisodes(current, page.items));
      setNextCursor(page.pageInfo.nextCursor ?? null);
      setHasMore(page.pageInfo.hasMore ?? Boolean(page.pageInfo.nextCursor));
    } catch (failure) {
      setError(normalizeProblem(failure));
    } finally {
      setLoadingMore(false);
    }
  }, [service, nextCursor, loadingMore]);

  const upsert = useCallback((episode: Episode) => {
    setItems((current) => {
      const exists = current.some((item) => item.id === episode.id);
      return exists
        ? current.map((item) => (item.id === episode.id ? episode : item))
        : [episode, ...current];
    });
  }, []);

  const remove = useCallback((episodeId: string) => {
    setItems((current) => current.filter((item) => item.id !== episodeId));
  }, []);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh: loadFirstPage,
    loadMore,
    upsert,
    remove,
  };
}
