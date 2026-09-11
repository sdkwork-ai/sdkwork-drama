# apps/

Purpose: application surfaces (web/desktop/mobile shells and app-scoped packages) owned by `sdkwork-drama`.

Owner: sdkwork-drama maintainers.

Allowed: application roots named `sdkwork-<code>-<arch>` with their own `packages/` families, each with `specs/` module contracts.

Forbidden: repository-root `packages/` (package families belong under `apps/sdkwork-<code>-<arch>/packages/`), backend Rust crates (belong in `crates/`), raw HTTP clients bypassing scoped SDK consumer imports.

Related specs: `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`, `../sdkwork-specs/APPLICATION_SPEC.md`, `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`.

Verification: `node ../sdkwork-specs/tools/audit-apps-directory-index-workspace.mjs --workspace .`

## Surface Index

| Surface | Path | Status |
| --- | --- | --- |
| (none yet — add rows when app roots land) | — | — |
