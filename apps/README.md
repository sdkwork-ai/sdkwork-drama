# apps/

Purpose: application surfaces (web/desktop/mobile shells and app-scoped packages) owned by `sdkwork-drama`.

Owner: sdkwork-drama maintainers.

Allowed: application roots named `sdkwork-<code>-<arch>` with their own `packages/` families, each with `specs/` module contracts.

Forbidden: repository-root `packages/` (package families belong under `apps/sdkwork-<code>-<arch>/packages/`), backend Rust crates (belong in `crates/`), raw HTTP clients bypassing scoped SDK consumer imports.

Related specs: `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`, `../sdkwork-specs/APPLICATION_SPEC.md`, `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`.

Verification: `node ../sdkwork-specs/tools/audit-apps-directory-index-workspace.mjs --workspace .`

The repository root is not a runnable primary app surface: it is the application composition root (backend crates, API contract, SDK families, deployment profiles), and every runnable client surface lives in a direct child of `apps/`.

## Surface Index

| Surface | Path | Status |
| --- | --- | --- |
| PC browser | `apps/sdkwork-drama-pc` | Initialized (IAM + appbase, adaptive web `pc-web`) |
| H5 browser | `apps/sdkwork-drama-h5` | Initialized (IAM + appbase, adaptive web `h5`) |

Both browser roots are served through one adaptive dev ingress (`apps/sdkwork-drama-pc` is the client-process root; the H5 renderer lives in its own root). Runtime documents and build artifacts follow `BROWSER_RUNTIME_ENV_SPEC.md` and `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` §2.1.
