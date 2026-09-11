import type { MediaAsset } from './media-asset';

export interface MediaAssetResponse {
  code: 0;
  data: MediaAsset;
  traceId: string;
}
