import type {
  CreateEpisodeRequest,
  Episode,
  EpisodePageData,
  SnowflakeId,
  UpdateEpisodeRequest,
} from '@sdkwork/drama-app-sdk';

/** Narrow generated-SDK port: services depend on this, never on a constructed client. */
export interface EpisodeApiPort {
  list(params?: { cursor?: string; pageSize?: number }): Promise<EpisodePageData>;
  create(body: CreateEpisodeRequest): Promise<Episode>;
  update(episodeId: SnowflakeId, body: UpdateEpisodeRequest): Promise<Episode>;
  delete(episodeId: SnowflakeId): Promise<void>;
  publish(episodeId: SnowflakeId): Promise<Episode>;
}

export interface EpisodeDraftInput {
  readonly title: string;
  readonly synopsis: string;
}

export const DEFAULT_PAGE_SIZE = 20;

export class EpisodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EpisodeValidationError';
  }
}

function normalizeDraft(input: EpisodeDraftInput): EpisodeDraftInput {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new EpisodeValidationError('Title is required.');
  }
  return { title, synopsis: input.synopsis.trim() };
}

export function createEpisodeService(api: EpisodeApiPort) {
  return {
    async list(cursor?: string): Promise<EpisodePageData> {
      return api.list({ pageSize: DEFAULT_PAGE_SIZE, ...(cursor ? { cursor } : {}) });
    },

    async create(input: EpisodeDraftInput): Promise<Episode> {
      const draft = normalizeDraft(input);
      return api.create({ title: draft.title, synopsis: draft.synopsis || null });
    },

    async update(episodeId: SnowflakeId, input: EpisodeDraftInput): Promise<Episode> {
      const draft = normalizeDraft(input);
      return api.update(episodeId, { title: draft.title, synopsis: draft.synopsis || null });
    },

    async remove(episodeId: SnowflakeId): Promise<void> {
      await api.delete(episodeId);
    },

    async publish(episodeId: SnowflakeId): Promise<Episode> {
      return api.publish(episodeId);
    },
  };
}

export type EpisodeService = ReturnType<typeof createEpisodeService>;

export function isPublishable(episode: Episode): boolean {
  return episode.status === 'draft';
}

export function isDraft(episode: Episode): boolean {
  return episode.status === 'draft';
}

export function statusCounts(episodes: readonly Episode[]) {
  return episodes.reduce(
    (counts, episode) => ({
      total: counts.total + 1,
      draft: counts.draft + (episode.status === 'draft' ? 1 : 0),
      published: counts.published + (episode.status === 'published' ? 1 : 0),
      retired: counts.retired + (episode.status === 'retired' ? 1 : 0),
    }),
    { total: 0, draft: 0, published: 0, retired: 0 },
  );
}
