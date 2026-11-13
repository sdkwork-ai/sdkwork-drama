import { describe, expect, it } from 'vitest';

import {
  base64FromDataUrl,
  MAX_ASSET_BYTES,
  MediaValidationError,
  validateMediaFile,
} from './media-service';

describe('media file validation', () => {
  it('accepts matching content types within the cap', () => {
    expect(() => validateMediaFile('cover', 'cover.png', 'image/png', 1024)).not.toThrow();
    expect(() => validateMediaFile('video', 'episode.mp4', 'video/mp4', 5_000_000)).not.toThrow();
    expect(() => validateMediaFile('audio', 'theme.mp3', 'audio/mpeg', 1024)).not.toThrow();
    expect(() =>
      validateMediaFile('subtitle', 'episode.vtt', 'text/vtt', 512),
    ).not.toThrow();
  });

  it('rejects mismatched kinds', () => {
    expect(() => validateMediaFile('cover', 'episode.mp4', 'video/mp4', 1024)).toThrow(
      MediaValidationError,
    );
  });

  it('rejects files over the 64 MiB proxy cap', () => {
    expect(() =>
      validateMediaFile('video', 'huge.mp4', 'video/mp4', MAX_ASSET_BYTES + 1),
    ).toThrow(/64 MiB/);
  });

  it('rejects empty files and missing names', () => {
    expect(() => validateMediaFile('video', '', 'video/mp4', 10)).toThrow(/Choose a file/);
    expect(() => validateMediaFile('video', 'clip.mp4', 'video/mp4', 0)).toThrow(/empty/);
  });

  it('extracts base64 payloads from data URLs', () => {
    expect(base64FromDataUrl('data:image/png;base64,QUJD')).toBe('QUJD');
    expect(() => base64FromDataUrl('not-a-data-url')).toThrow(MediaValidationError);
  });
});
