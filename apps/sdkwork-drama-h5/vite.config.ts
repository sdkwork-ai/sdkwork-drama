import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { resolveBrowserDistOutDir } from '../../../sdkwork-specs/tools/browser-dist-layout.mjs';
import { buildBrowserDevRuntimeEnvDocument } from '../../../sdkwork-specs/tools/browser-runtime-env.mjs';
import { createBrowserRuntimeEnvVitePlugin } from '../../../sdkwork-specs/tools/browser-runtime-env-vite.mjs';
import { resolveViteRuntimeProfile } from '../../../sdkwork-specs/tools/vite-runtime-profile.mjs';

const DEV_PORT_ENV = 'SDKWORK_DRAMA_H5_INTERNAL_DEV_PORT';
const DEFAULT_DEV_PORT = 5346;

function resolveDevPort(): number {
  const raw = Number(process.env[DEV_PORT_ENV] ?? DEFAULT_DEV_PORT);
  return Number.isInteger(raw) && raw > 0 && raw <= 65535 ? raw : DEFAULT_DEV_PORT;
}

/**
 * Dev runtime document (BROWSER_RUNTIME_ENV_SPEC.md section 2): same-origin
 * canonical API bases served only by the dev middleware. The build artifact is
 * materialized into public/runtime-env.json by build-browser-client.mjs.
 */
function resolveDevRuntimeDocument(profileId: string): string {
  const [deploymentProfile = 'standalone', environment = 'development'] = profileId.split('.');
  return JSON.stringify(buildBrowserDevRuntimeEnvDocument({
    profileId,
    deploymentProfile,
    environment,
  }));
}

export default defineConfig(({ mode }) => {
  const runtimeProfile = resolveViteRuntimeProfile(mode, process.env);
  return {
    base: './',
    plugins: [
      react(),
      createBrowserRuntimeEnvVitePlugin({
        name: 'sdkwork-drama-h5-runtime-env',
        path: '/runtime-env.json',
        resolveServeDocument: () => resolveDevRuntimeDocument(runtimeProfile.profileId),
      }),
    ],
    define: {
      'import.meta.env.VITE_SDKWORK_DEPLOYMENT_PROFILE': JSON.stringify(runtimeProfile.deploymentProfile),
      'import.meta.env.VITE_SDKWORK_ENVIRONMENT': JSON.stringify(runtimeProfile.environment),
    },
    server: {
      host: '127.0.0.1',
      port: resolveDevPort(),
      strictPort: true,
    },
    preview: {
      host: '127.0.0.1',
      port: resolveDevPort(),
      strictPort: true,
    },
    build: {
      outDir: resolveBrowserDistOutDir(runtimeProfile.environment, runtimeProfile.deploymentProfile),
      emptyOutDir: true,
      sourcemap: true,
    },
  };
});
