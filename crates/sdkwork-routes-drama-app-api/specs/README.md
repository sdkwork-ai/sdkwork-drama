# specs/ — sdkwork-routes-drama-app-api

Module-local spec system for the drama app-api route crate.

## Component

- Name: `sdkwork-routes-drama-app-api`
- Layer: L1 route adapter (`backend-route` per `../sdkwork-specs/COMPOSABLE_ARCHITECTURE_SPEC.md` §2)
- Surface: app-api (`/app/v3/api`)

## Contracts

- Dependencies: `sdkwork-drama-episode-service` (service port only), `sdkwork-web-framework`, axum.
- Forbidden dependencies: `sdkwork-drama-episode-repository-sqlx`, any `*-repository-sqlx`, direct database access.
- File layout: `src/paths.rs`, `src/routes.rs`, `src/handlers.rs`, `src/manifest.rs` per `../sdkwork-specs/WEB_BACKEND_SPEC.md` §3.
- Response envelope: `sdkwork-v3` per `../sdkwork-specs/API_SPEC.md` §4.5.
- Health paths are reserved by the standard owner; this crate mounts none.

## Verification

- `cargo clippy -p sdkwork-routes-drama-app-api --all-targets -- -D warnings`
- `cargo test -p sdkwork-routes-drama-app-api`
- `node ../../../../sdkwork-specs/tools/audit-route-crate-naming-workspace.mjs --workspace ../..`
