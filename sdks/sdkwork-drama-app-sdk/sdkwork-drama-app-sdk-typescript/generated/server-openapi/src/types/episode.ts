import type { EpisodeStatus } from './episode-status';
import type { SnowflakeId } from './snowflake-id';

export interface Episode {
  id: SnowflakeId;
  tenantId: SnowflakeId;
  title: string;
  synopsis?: string | null;
  status: EpisodeStatus;
  createdAt: string;
  updatedAt: string;
}
