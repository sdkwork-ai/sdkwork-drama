import type { MediaAsset } from '@sdkwork/drama-app-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MediaService } from '../services/media-service';
import { normalizeProblem, type NormalizedProblem } from '../services/problem';

export interface MediaAssetsState {
  readonly items: readonly MediaAsset[];
  readonly loading: boolean;
  readonly error: NormalizedProblem | null;
  readonly refresh: () => Promise<void>;
  readonly add: (asset: MediaAsset) => void;
}

export function useMediaAssets(
  service: MediaService | null,
  episodeId: string | null,
  enabled = true,
): MediaAssetsState {
  const [items, setItems] = useState<readonly MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedProblem | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!service || !episodeId || !enabled) {
      setItems([]);
      setError(null);
      return;
    }
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError(null);
    try {
      const assets = await service.list(episodeId);
      if (requestId.current === id) setItems(assets);
    } catch (failure) {
      if (requestId.current === id) {
        setError(normalizeProblem(failure));
        setItems([]);
      }
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [service, episodeId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    void load();
  }, [enabled, load]);

  const add = useCallback((asset: MediaAsset) => {
    setItems((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
  }, []);

  return { items, loading, error, refresh: load, add };
}
