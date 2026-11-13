import type {
  CreateMediaAssetRequest,
  MediaAsset,
  MediaAssetListData,
  SnowflakeId,
} from '@sdkwork/drama-app-sdk';

export type MediaKind = CreateMediaAssetRequest['kind'];

/** Proxy upload decoded cap (64 MiB) enforced by the app-api contract. */
export const MAX_ASSET_BYTES = 64 * 1024 * 1024;

export const MEDIA_KIND_LABELS: Readonly<Record<MediaKind, string>> = {
  cover: 'Cover image',
  video: 'Episode video',
  audio: 'Audio track',
  subtitle: 'Subtitle',
};

export const MEDIA_KIND_ACCEPT: Readonly<Record<MediaKind, string>> = {
  cover: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  subtitle: '.vtt,.srt,text/vtt,application/x-subrip,text/plain',
};

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}

export function validateMediaFile(
  kind: MediaKind,
  fileName: string,
  contentType: string,
  sizeBytes: number,
): void {
  if (fileName.trim().length === 0) {
    throw new MediaValidationError('Choose a file to upload.');
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new MediaValidationError('The selected file is empty.');
  }
  if (sizeBytes > MAX_ASSET_BYTES) {
    throw new MediaValidationError(
      `The file is ${(sizeBytes / (1024 * 1024)).toFixed(1)} MiB; the proxy upload cap is 64 MiB.`,
    );
  }
  const type = contentType.toLowerCase();
  const allowed = kind === 'cover'
    ? type.startsWith('image/')
    : kind === 'video'
      ? type.startsWith('video/') || type === 'application/octet-stream'
      : kind === 'audio'
        ? type.startsWith('audio/') || type === 'application/octet-stream'
        : type.startsWith('text/') || type === 'application/x-subrip' || type === 'application/octet-stream';
  if (!allowed) {
    throw new MediaValidationError(
      `${MEDIA_KIND_LABELS[kind]} does not accept this content type (${contentType || 'unknown'}).`,
    );
  }
}

export function base64FromDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    throw new MediaValidationError('The selected file could not be encoded.');
  }
  return dataUrl.slice(comma + 1);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new MediaValidationError('The selected file could not be read.'));
        return;
      }
      resolve(base64FromDataUrl(reader.result));
    };
    reader.onerror = () => reject(new MediaValidationError('The selected file could not be read.'));
    reader.readAsDataURL(file);
  });
}

/** Narrow generated-SDK port for the episode asset resources. */
export interface MediaApiPort {
  list(episodeId: SnowflakeId): Promise<MediaAssetListData>;
  create(episodeId: SnowflakeId, body: CreateMediaAssetRequest): Promise<MediaAsset>;
}

export function createMediaService(api: MediaApiPort) {
  return {
    async list(episodeId: SnowflakeId): Promise<readonly MediaAsset[]> {
      const page = await api.list(episodeId);
      return [...page.items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    async upload(episodeId: SnowflakeId, kind: MediaKind, file: File): Promise<MediaAsset> {
      validateMediaFile(kind, file.name, file.type, file.size);
      const content = await readFileAsBase64(file);
      return api.create(episodeId, {
        kind,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        content,
        encoding: 'base64',
      });
    },
  };
}

export type MediaService = ReturnType<typeof createMediaService>;
