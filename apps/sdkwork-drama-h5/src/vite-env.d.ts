/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SDKWORK_API_BASE_URL?: string;
  readonly VITE_SDKWORK_DEPLOYMENT_PROFILE?: string;
  readonly VITE_SDKWORK_ENVIRONMENT?: string;
  readonly VITE_SDKWORK_TENANT_ID?: string;
  readonly VITE_SDKWORK_ORGANIZATION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
