// Composed consumer facade for the drama app-sdk family
// (`@sdkwork/drama-app-sdk`). Re-exports the generator-owned transport from
// `generated/server-openapi` without copying generated source; consumers MUST
// import through this facade only
// (`../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`).
import {
  createClient as createGeneratedAppClient,
  SdkworkAppClient,
} from '../generated/server-openapi/src/index';
import type { SdkworkAppConfig } from '../generated/server-openapi/src/types/common';

export { SdkworkAppClient, createGeneratedAppClient };
export type { SdkworkAppConfig };
export * from '../generated/server-openapi/src/types';
export * from '../generated/server-openapi/src/api';
export * from '../generated/server-openapi/src/http';
export * from '../generated/server-openapi/src/auth';

export function createClient(config: SdkworkAppConfig): SdkworkAppClient {
  return createGeneratedAppClient(config);
}
