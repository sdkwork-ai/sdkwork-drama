import { createTokenManager, type AuthTokens } from '@sdkwork/sdk-common';

const TOKEN_STORAGE_KEY = 'sdkwork.drama.session.tokens';

function normalized(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStoredTokens(): AuthTokens | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const record = parsed as Record<string, unknown>;
    const tokens: AuthTokens = {
      ...(normalized(record.accessToken) ? { accessToken: normalized(record.accessToken) } : {}),
      ...(normalized(record.authToken) ? { authToken: normalized(record.authToken) } : {}),
      ...(normalized(record.refreshToken) ? { refreshToken: normalized(record.refreshToken) } : {}),
      ...(typeof record.expiresAt === 'number' ? { expiresAt: record.expiresAt } : {}),
      ...(normalized(record.tokenType) ? { tokenType: normalized(record.tokenType) } : {}),
      ...(normalized(record.scope) ? { scope: normalized(record.scope) } : {}),
    };
    return Object.keys(tokens).length > 0 ? tokens : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}

function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}

/**
 * Resolve the app-api base URL from the published browser runtime document,
 * falling back to the Vite environment for direct `vite` runs that bypass the
 * topology dev ingress. Same-origin documents use root-relative bases
 * (`/app/v3/api` or `/`), which is exactly what generated SDK clients expect.
 */
export function resolveRuntimeApiBaseUrl(): string {
  const globalRecord = globalThis as unknown as Record<string, unknown>;
  const document = globalRecord.SDKWORK_RUNTIME_ENV as { appApiBaseUrl?: unknown } | undefined;
  const fromDocument = normalized(document?.appApiBaseUrl);
  if (fromDocument.length > 0) return fromDocument;
  return normalized(import.meta.env.VITE_SDKWORK_API_BASE_URL);
}

/**
 * One token manager is shared by every selected app SDK. Tokens persist across
 * reloads through a browser storage adapter; clearTokens() removes them on
 * logout, refresh failure, and account/tenant switch.
 */
export const sessionTokenManager = createTokenManager(readStoredTokens(), {
  onTokenSet: writeStoredTokens,
  onTokenCleared: clearStoredTokens,
});
