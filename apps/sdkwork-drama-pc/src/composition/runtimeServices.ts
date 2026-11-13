import { createClient as createDramaClient } from '@sdkwork/drama-app-sdk';

import { createIamAccountService } from '../account/iam-account';
import { createEpisodeService, type EpisodeService } from '../services/episode-service';
import { createMediaService, type MediaService } from '../services/media-service';
import { resolveRuntimeApiBaseUrl, sessionTokenManager } from './sessionRuntime';

export interface AppServices {
  readonly iam: ReturnType<typeof createIamAccountService>;
  readonly episodes: EpisodeService;
  readonly media: MediaService;
}

export interface AppRuntime {
  readonly baseUrl: string | null;
  readonly services: AppServices | null;
}

/**
 * Composition root: constructs the generated SDK clients and the services the
 * UI consumes. UI components never construct SDK clients or auth headers.
 */
export function createAppRuntime(): AppRuntime {
  const baseUrl = resolveRuntimeApiBaseUrl();
  if (baseUrl.length === 0) {
    return { baseUrl: null, services: null };
  }

  const dramaClient = createDramaClient({
    baseUrl,
    tokenManager: sessionTokenManager,
  });

  return {
    baseUrl,
    services: {
      iam: createIamAccountService({ baseUrl, tokenManager: sessionTokenManager }),
      episodes: createEpisodeService(dramaClient.episode),
      media: createMediaService(dramaClient.media.episodeAssets),
    },
  };
}
