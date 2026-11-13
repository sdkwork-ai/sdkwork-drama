import { createIntegratedSdkClients } from './sdkClients';
import { resolveRuntimeApiBaseUrl, sessionTokenManager } from './sessionRuntime';

export { resolveRuntimeApiBaseUrl, sessionTokenManager };

/**
 * Build the integrated component SDK clients from the runtime base resolved at
 * bootstrap. Returns null while the runtime document is unconfigured, which is
 * a valid `api-unconfigured` state rather than an error.
 */
export function createRuntimeSdkClients() {
  const baseUrl = resolveRuntimeApiBaseUrl();
  return baseUrl.length > 0
    ? createIntegratedSdkClients({
        baseUrl,
        tokenManager: sessionTokenManager,
      })
    : null;
}
