import type { SnowflakeId } from './snowflake-id';

export interface MediaAsset {
  id: SnowflakeId;
  episodeId: SnowflakeId;
  kind: 'cover' | 'video' | 'audio' | 'subtitle';
  /** Stable drive reference: drive://spaces/{spaceId}/nodes/{nodeId}. */
  driveUri: string;
  fileName: string;
  contentType: string;
  /** Byte length as an int64 string (API_SPEC 13.6). */
  contentLength: string;
  status: string;
  createdAt: string;
}
