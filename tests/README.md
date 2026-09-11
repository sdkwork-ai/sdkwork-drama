# tests/

Purpose: cross-module integration and contract tests that do not belong to a single crate or app root.

Owner: sdkwork-drama maintainers.

Allowed: integration test crates/harnesses, contract tests against `apis/open-api/` authorities using scoped SDK consumer imports.

Forbidden: unit tests that belong in the crate they test, raw HTTP clients bypassing scoped SDK consumers, secrets.

Related specs: `../sdkwork-specs/TEST_SPEC.md`, `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`.

## Test Inventory

| Test | Location | Scope |
| --- | --- | --- |
| Route manifest ↔ OpenAPI contract sync | `crates/sdkwork-routes-drama-app-api/tests/contract_sync.rs` | Method/path/operationId/auth parity between the Rust manifest and the contract authority |
| Episode + media service behaviour | `crates/sdkwork-drama-episode-service/src/service.rs`, `crates/sdkwork-drama-media-service` unit tests | Domain rules, tenant isolation, cursor pagination, error semantics |
| Envelope contract | `crates/sdkwork-routes-drama-app-api` unit tests | v3 success envelope, 201 data.item, 204, problem+json, internal-error sanitisation |
| **Live smoke** (gated) | `crates/sdkwork-api-drama-assembly/tests/live_smoke.rs` | Full stack against a real PostgreSQL: database/drive/web-store bootstrap, dual-token flow, envelope shapes, tenant isolation, publish lifecycle, drive-backed upload, delete |

## Running The Live Smoke

Requires a development PostgreSQL instance. In one shell:

```bash
source etc/topology/standalone.development.env   # SDKWORK_DATABASE_URL etc.
export SDKWORK_DRAMA_LIVE_SMOKE=1
cargo test -p sdkwork-api-drama-assembly --test live_smoke
```

Without `SDKWORK_DRAMA_LIVE_SMOKE=1` the test skips itself, so
`cargo test --workspace` stays hermetic.

Verification: `cargo test --workspace`
