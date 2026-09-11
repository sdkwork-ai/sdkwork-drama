import type { Episode } from './episode';

export interface EpisodeResponse {
  code: 0;
  data: Episode;
  traceId: string;
}
