# apis/

Purpose: OpenAPI contract authority for this application — the single source of API truth that route crates and SDK generation consume.

Owner: sdkwork-drama maintainers.

Allowed: OpenAPI documents (`open-api/`), route manifests derived from route crates, contract review notes.

Forbidden: generated SDK output (lives in `sdks/`), hand-edited generated files, runtime configuration.

Related specs: `../sdkwork-specs/API_SPEC.md`, `../sdkwork-specs/WEB_BACKEND_SPEC.md`, `../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`.

Verification: `node ../sdkwork-specs/tools/check-api-operation-patterns.mjs --root .`
