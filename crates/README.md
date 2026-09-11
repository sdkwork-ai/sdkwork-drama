# crates/

Purpose: Rust crate workspace for the `drama` backend — route crates, service crates, repository crates, API assembly, and standalone gateway.

Owner: sdkwork-drama maintainers.

Allowed: crates named per the SDKWork crate family (`sdkwork-routes-<capability>-<surface>`, `sdkwork-<domain>-<capability>-service`, `sdkwork-<domain>-<capability>-repository-sqlx`, `sdkwork-api-<application-code>-assembly`, `sdkwork-api-<application-code>-standalone-gateway`), each with module-local `specs/`.

Forbidden: layering violations (route crates depending on repository crates or HTTP framework types leaking into services; services depending on `*-repository-sqlx` or axum types; repositories depending on axum), re-exporting dependency crates across layer boundaries.

Related specs: `../sdkwork-specs/RUST_CODE_SPEC.md`, `../sdkwork-specs/COMPOSABLE_ARCHITECTURE_SPEC.md` (§5-6), `../sdkwork-specs/WEB_BACKEND_SPEC.md`, `../sdkwork-specs/WEB_FRAMEWORK_SPEC.md`.

Verification: `cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace && node ../sdkwork-specs/tools/audit-route-crate-naming-workspace.mjs --workspace .`
