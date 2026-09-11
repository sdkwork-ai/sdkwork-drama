import type { Episode } from './episode';
import type { PageInfo } from './page-info';

export interface EpisodePageData {
  items: Episode[];
  pageInfo: PageInfo;
}
