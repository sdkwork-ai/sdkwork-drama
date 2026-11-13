import type { EpisodeStatus } from '@sdkwork/drama-app-sdk';

import { statusLabel } from '../services/format';

export function StatusBadge({ status }: { readonly status: EpisodeStatus }) {
  return (
    <span className="status-badge" data-status={status}>
      <span className="status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
