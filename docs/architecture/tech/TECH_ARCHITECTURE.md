# SDKWork Drama — Technical Architecture

- Status: Draft (initial alignment baseline; 🔒 requires architecture review before further extension)
- Owner: sdkwork-drama maintainers
- Backend framework: Rust (`rust-axum`) per `../../../sdkwork-specs/COMPOSABLE_ARCHITECTURE_SPEC.md`
- Decision records follow `../../../sdkwork-specs/ARCHITECTURE_DECISION_SPEC.md`

## 1. Architecture Overview

The application follows the SDKWork composable layering; dependency arrows
point strictly downward.

| Layer | Crate | Responsibility |
| --- | --- | --- |
| L1 route adapter | `sdkwork-routes-drama-app-api` | HTTP handlers, wire DTOs, `HttpRouteManifest`, envelope/problem mapping |
| L2/L3 domain service | `sdkwork-drama-episode-service`, `sdkwork-drama-media-service` | Business rules, ports (`EpisodeRepository`, `MediaStorage`, `MediaAssetRepository`) |
| L4 repository adapter | `sdkwork-drama-episode-repository-sqlx`, `sdkwork-drama-media-repository-sqlx` | PostgreSQL persistence behind service ports |
| L4 storage adapter | `sdkwork-drama-media-drive` | All file uploads through the SDKWork Drive uploader service |
| L4 database host | `sdkwork-drama-database-host` | `sdkwork-database` framework bootstrap, lifecycle assets, snowflake identity |
| L5 assembly | `sdkwork-api-drama-assembly` | Composition root: wiring, IAM web-framework layer, health endpoints |
| Process host | `sdkwork-api-drama-standalone-gateway` | Standalone listener (`sdkwork-api-<code>-standalone-gateway` naming), graceful shutdown |

## 2. Technology Choices And Framework Integrations

- **`sdkwork-web-framework`** (sub-crate path protocol): IAM adapter-built
  `WebFrameworkBuilder` layer (context resolution + manifest authorization)
  with production-hardening stores backed by the application Postgres pool —
  idempotency, rate limiting, audit emitter, security-event emitter, request
  metrics, and a 60s request timeout — plus `service_router` infrastructure
  endpoints (`/healthz`, `/livez`, `/readyz`, `/metrics`) and `serve` with
  graceful shutdown. The `web_*` store tables are installed by the
  sdkwork-web database module (`SDKWORK_WEB_STORE_APP_ROOT`, fallback: the
  web-framework checkout beside this repository).
- **`sdkwork-iam`** (`sdkwork-iam-web-adapter`): dual-token context
  resolution and manifest-driven authorization for app-api. Development
  environments may use the adapter's unverified dev fallback
  (`allows_dev_authentication_fallback`); production always resolves through
  the IAM database session store.
- **`sdkwork-database`**: `DatabaseConfig::from_env` → `create_pool_from_config`
  → lifecycle orchestrator over `database/` assets (baseline + migrations) →
  snowflake id generator (`sdkwork-database-id`). No runtime DDL in code.
- **`sdkwork-utils`** (`sdkwork-utils-rust`): envelope types
  (`SdkWorkApiResponse`, `SdkWorkProblemDetail`), result codes, pagination
  (`PageInfo`, `SdkWorkPageData`), crypto/datetime/id helpers.
- **`sdkwork-drive`**: embedded crate integration
  (`sdkwork-drive-uploader-service` + `sdkwork-drive-object-runtime` +
  `sdkwork-drive-workspace-service`), embedded core schema install, and a
  standalone local filesystem provider seed. Media business code only sees
  the `MediaStorage` port. Upload requests carry file bytes as canonical
  base64 JSON (the platform content payload idiom; JSON-only bodies keep the
  contract SDK-generatable); the decoded cap is 64 MiB — larger episode
  videos use the drive presigned direct-upload flow, which bypasses the
  application process entirely. Deleting an episode intentionally leaves the
  drive nodes in place: drive objects carry `app_id`/`app_resource_type`/
  `app_resource_id` ownership fields and post-episode storage lifecycle is
  governed by drive retention and maintenance pipelines, not by drama code.
- **`sdkwork-discovery` / RPC**: not integrated. Drama exposes no gRPC
  services; revisit when an RPC surface (e.g., transcoding worker) exists.

## 3. Wire Contract

Success: `SdkWorkApiResponse` (`{code: 0, data, traceId}`) with
`X-SdkWork-Trace-Id`. Failure: RFC 9457 `application/problem+json`
(`SdkWorkProblemDetail`). Listing: `SdkWorkPageData` cursor pages.
Authority: `../../../sdkwork-specs/API_SPEC.md` §4.5, §14-16; operation
inventory in `apis/open-api/`.

## 4. Data Model

PostgreSQL schema owned by `database/` assets; ids are snowflake BIGINT,
every business table carries `tenant_id`/`user_id` subject columns
(`SUBJECT_ID_SPEC.md`). Tables: `drama_episodes`, `drama_media_assets`
(FK → `drama_episodes`, ON DELETE CASCADE). Drive-owned tables (`dr_drive_*`)
are provisioned by the Drive embedded installer.

## 5. Configuration And Deployment

Runtime configuration resolves from `SDKWORK_DATABASE_*`,
`SDKWORK_DRAMA_HTTP_BIND`, `SDKWORK_DRAMA_APP_ROOT`, and the IAM
environment family; source profiles live under `etc/`
(`SOURCE_CONFIG_SPEC.md`). Deployment profiles: `standalone` and `cloud`
with identical API contracts; packaging under `deployments/`.

## 6. Contract And SDK Chain

`apis/open-api/drama/drama-app-api.openapi.json` is the API truth source; the
route-crate manifest must mirror it operation-for-operation — enforced by the
`contract_sync` integration test (method, path, operation id, auth mode).
The TypeScript transport is generated with the offline `sdkgen` CLI
(`../sdkwork-sdk-generator/bin/sdkgen.js`, standard profile `sdkwork-v3`,
scheme names `AuthToken` + `AccessToken`, lowerCamelCase path parameters and
`resource.action` operation ids). Consumers import only the composed facade
`@sdkwork/drama-app-sdk`; generated output is never hand-edited.

## 7. Verification

`cargo fmt` (drama packages) / `cargo clippy --workspace --all-targets -- -D
warnings` / `cargo test --workspace` / `cargo build --workspace`, plus the
repository standard audits listed in `AGENTS.md` and the generated-SDK
`publish-core` check/build commands (`sdks/README.md`).
