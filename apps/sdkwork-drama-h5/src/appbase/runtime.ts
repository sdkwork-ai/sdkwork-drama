export interface AppRuntimeEnvironment {
  readonly appCode: string;
  readonly architecture: string;
  readonly profile: string;
  readonly environment: string;
  readonly apiBaseUrl: string | null;
}

interface BrowserRuntimeDocument {
  readonly appApiBaseUrl?: unknown;
  readonly backendApiBaseUrl?: unknown;
  readonly openApiBaseUrl?: unknown;
  readonly deploymentProfile?: unknown;
  readonly environment?: unknown;
  readonly profileId?: unknown;
  readonly [key: string]: unknown;
}

const RUNTIME_DOCUMENT_PATH = '/runtime-env.json';
const RUNTIME_ENV_GLOBAL_KEY = 'SDKWORK_RUNTIME_ENV';
const DEPLOYMENT_MODE_GLOBAL_KEYS = [
  'SDKWORK_DEPLOYMENT_PROFILE',
  'SDKWORK_DEPLOY_MODE',
  'VITE_SDKWORK_DEPLOYMENT_PROFILE',
  'VITE_SDKWORK_DEPLOY_MODE',
] as const;

function normalized(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Publish the browser runtime document to the canonical global bridge
 * (BROWSER_RUNTIME_ENV_SPEC.md section 4) before the first SDK client call.
 */
export function publishBrowserRuntimeEnv(document: BrowserRuntimeDocument): void {
  const target = globalThis as unknown as Record<string, unknown>;
  const deploymentProfile = normalized(document.deploymentProfile) || 'standalone';
  target[RUNTIME_ENV_GLOBAL_KEY] = Object.freeze({
    ...document,
    ...Object.fromEntries(
      DEPLOYMENT_MODE_GLOBAL_KEYS.map((key) => [key, deploymentProfile]),
    ),
  });
}

async function fetchBrowserRuntimeDocument(): Promise<BrowserRuntimeDocument | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const response = await fetch(RUNTIME_DOCUMENT_PATH, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return recordOf(payload) ?? null;
  } catch {
    // A missing runtime document is a valid unconfigured state, not a crash.
    return null;
  }
}

export function readAppRuntimeEnvironment(
  env: ImportMetaEnv = import.meta.env,
  document?: BrowserRuntimeDocument,
): AppRuntimeEnvironment {
  const apiBaseUrl = normalized(document?.appApiBaseUrl)
    || normalized(env.VITE_SDKWORK_API_BASE_URL);
  return {
    appCode: 'sdkwork-drama',
    architecture: 'h5',
    profile: normalized(document?.deploymentProfile)
      || normalized(env.VITE_SDKWORK_DEPLOYMENT_PROFILE)
      || normalized(env.MODE)
      || 'standalone',
    environment: normalized(document?.environment)
      || normalized(env.VITE_SDKWORK_ENVIRONMENT)
      || normalized(env.MODE)
      || 'development',
    apiBaseUrl: apiBaseUrl.length > 0 ? apiBaseUrl : null,
  };
}

/**
 * Load the same-origin runtime document and publish it to the SDK global
 * bridge. Called once during bootstrap, before React renders.
 */
export async function loadAppRuntimeEnvironment(): Promise<AppRuntimeEnvironment> {
  const document = await fetchBrowserRuntimeDocument();
  if (document) publishBrowserRuntimeEnv(document);
  return readAppRuntimeEnvironment(import.meta.env, document ?? undefined);
}

export function describeRuntime(env: AppRuntimeEnvironment): string {
  return [
    env.appCode,
    env.architecture,
    env.profile,
    env.environment,
    env.apiBaseUrl ? 'api-configured' : 'api-unconfigured',
  ].join(' · ');
}
