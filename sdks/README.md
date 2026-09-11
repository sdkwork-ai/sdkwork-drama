# sdks/

Purpose: SDK families, family manifests, OpenAPI authorities, derived generator inputs, route manifests, and generated outputs for the `drama` application.

Owner: sdkwork-drama maintainers (generated output is generator-owned).

Allowed: SDK family roots `sdkwork-<domain>-<surface>-sdk/` containing `sdkwork-<domain>-<surface>-sdk-typescript/` composed facades (`src/index.ts`) and `generated/` transport output.

Forbidden: hand-editing anything under `generated/` (fix the generation chain and regenerate instead), consumer imports of generator transport names (`sdkwork-*-generated-typescript`), cross-family generated imports.

Related specs: `../sdkwork-specs/SDK_SPEC.md`, `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`, `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md` (§9).

Verification: `node ../sdkwork-specs/tools/check-sdk-standard.mjs --workspace . && node ../sdkwork-specs/tools/check-app-sdk-consumer-imports.mjs --workspace .`
