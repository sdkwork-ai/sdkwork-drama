import type { NormalizedProblem } from '../services/problem';

export function ErrorPanel({
  problem,
  onRetry,
  retryLabel = 'Retry',
}: {
  readonly problem: NormalizedProblem;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
}) {
  return (
    <div className="error-panel" role="alert">
      <div>
        <strong>{problem.title}</strong>
        <p>{problem.detail}</p>
        {problem.traceId ? <code>trace {problem.traceId}</code> : null}
      </div>
      {onRetry ? (
        <button type="button" className="button" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
