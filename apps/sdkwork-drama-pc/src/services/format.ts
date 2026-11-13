import type { EpisodeStatus } from '@sdkwork/drama-app-sdk';

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatBytes(value: string | number | undefined | null): string {
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (bytes === undefined || bytes === null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`;
}

export function statusLabel(status: EpisodeStatus): string {
  if (status === 'published') return 'Published';
  if (status === 'retired') return 'Retired';
  return 'Draft';
}

export function mediaKindLabel(kind: 'cover' | 'video' | 'audio' | 'subtitle'): string {
  if (kind === 'cover') return 'Cover image';
  if (kind === 'video') return 'Episode video';
  if (kind === 'audio') return 'Audio track';
  return 'Subtitle';
}
