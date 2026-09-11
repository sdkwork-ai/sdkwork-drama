export interface CreateMediaAssetRequest {
  kind: 'cover' | 'video' | 'audio' | 'subtitle';
  fileName: string;
  contentType: string;
  /** Canonical base64 of the file bytes; decoded cap 67108864 bytes (64 MiB). */
  content: string;
  encoding: 'base64';
}
