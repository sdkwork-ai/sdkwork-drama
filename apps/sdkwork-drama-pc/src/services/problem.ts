export interface NormalizedProblem {
  readonly title: string;
  readonly detail: string;
  readonly status?: number;
  readonly code?: number;
  readonly traceId?: string;
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function textOf(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function numberOf(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Normalize SDK errors. SDKWork app-api failures are RFC 9457
 * `application/problem+json` documents; transport failures surface as plain
 * Error objects. Never render raw payloads or credentials.
 */
export function normalizeProblem(error: unknown): NormalizedProblem {
  const record = recordOf(error);
  if (record) {
    const title = textOf(record, 'title');
    const detail = textOf(record, 'detail');
    if (title || detail) {
      return {
        title: title ?? 'Request failed',
        detail: detail ?? title ?? 'The server rejected the request.',
        ...(numberOf(record, 'status') !== undefined ? { status: numberOf(record, 'status') } : {}),
        ...(numberOf(record, 'code') !== undefined ? { code: numberOf(record, 'code') } : {}),
        ...(textOf(record, 'traceId') !== undefined ? { traceId: textOf(record, 'traceId') } : {}),
      };
    }
    if (error instanceof Error && error.message.trim().length > 0) {
      return { title: 'Request failed', detail: error.message };
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return { title: 'Request failed', detail: error.message };
  }
  return { title: 'Request failed', detail: 'An unexpected error occurred. Try again.' };
}

export function problemSummary(problem: NormalizedProblem): string {
  const code = problem.code !== undefined ? ` (code ${problem.code})` : '';
  return `${problem.detail}${code}`;
}
