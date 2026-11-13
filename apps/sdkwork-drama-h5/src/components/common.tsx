import type { EpisodeStatus } from '@sdkwork/drama-app-sdk';

import { statusLabel } from '../services/format';
import type { NormalizedProblem } from '../services/problem';

export function StatusTag({ status }: { readonly status: EpisodeStatus }) {
  return (
    <span className="status-tag" data-status={status}>
      <span className="status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

export function ErrorBanner({
  problem,
  onRetry,
}: {
  readonly problem: NormalizedProblem;
  readonly onRetry?: () => void;
}) {
  return (
    <div className="error-banner" role="alert">
      <div>
        <strong>{problem.title}</strong>
        <p>{problem.detail}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({
  title,
  hint,
  action,
}: {
  readonly title: string;
  readonly hint: string;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}) {
  return (
    <div className="empty-block">
      <strong>{title}</strong>
      <p>{hint}</p>
      {action ? (
        <button type="button" className="btn" data-tone="primary" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { readonly rows?: number }) {
  return (
    <div className="skeleton-rows" aria-label="Loading">
      {Array.from({ length: rows }, (_value, index) => (
        <span className="skeleton-row" key={index} />
      ))}
    </div>
  );
}
