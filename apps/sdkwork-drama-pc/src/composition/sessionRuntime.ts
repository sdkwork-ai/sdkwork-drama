import { createTokenManager } from '@sdkwork/sdk-common';

function normalized(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

interface BrowserRuntimeBridge {
  readonly appApiBaseUrl?: unknown;
}

/**
 * Resolve the app-api base URL from the published browser runtime document,
 * falling back to the Vite environment for direct `vite` runs that bypass the
 * topology dev ingress. Same-origin documents use root-relative bases
 * (`/app/v3/api` or `/`), which is exactly what generated SDK clients expect.
 */
export function resolveRuntimeApiBaseUrl(): string {
  const globalRecord = globalThis as unknown as Record<string, unknown>;
  const document = globalRecord.SDKWORK_RUNTIME_ENV as BrowserRuntimeBridge | undefined;
  const fromDocument = normalized(document?.appApiBaseUrl);
  if (fromDocument.length > 0) return fromDocument;
  return normalized(import.meta.env.VITE_SDKWORK_API_BASE_URL);
}

/**
 * One token manager is shared by every selected app SDK. Business code must use
 * this runtime instance instead of constructing a second session source.
 */
export const sessionTokenManager = createTokenManager();
