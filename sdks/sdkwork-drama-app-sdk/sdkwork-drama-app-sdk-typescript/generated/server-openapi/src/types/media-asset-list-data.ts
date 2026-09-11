import type { MediaAsset } from './media-asset';
import type { PageInfo } from './page-info';

export interface MediaAssetListData {
  items: MediaAsset[];
  pageInfo: PageInfo;
}
