# sdkwork-drama

Short-drama (短剧) video creation application. Rust (`rust-axum`) backend following the SDKWork layered architecture, with OpenAPI contract authority under `apis/`, generated SDK families under `sdks/`, and scaffold-initialized PC/H5 browser surfaces under `apps/`.

- repository-kind: application
- Domain: `drama`
- Application code: `drama`
- Backend framework: `rust-axum`
- Deployment profiles: `standalone`, `cloud`
- Owned surface: `app-api` (dual-token protected; probes anonymous)
- Client surfaces: `pc` / `h5` (adaptive web, scaffold-initialized with IAM + appbase)

## Documentation Canon

- Product: `docs/product/prd/PRD.md`
- Architecture: `docs/architecture/tech/TECH_ARCHITECTURE.md`
- Documentation index: `docs/README.md`
- Agent entrypoint: `AGENTS.md`
- Standards: `../sdkwork-specs/README.md`

## Capabilities

- Episode authoring (create/retrieve/list/update/delete/publish) with cursor pagination.
- Media assets (cover/video/audio/subtitle) uploaded through the embedded SDKWork Drive integration (`drive://` coordinates, storage-provider agnostic).
- IAM dual-token protection, idempotency and rate-limit stores, audit/security-event emitters, request metrics — all through `sdkwork-web-framework`.
- PC/H5 browser shells with the appbase runtime, IAM sign-in/session, and per-component integration records (`config/components/`).

## Quick Start

```bash
# Source the standalone development profile (local Postgres placeholder).
source etc/topology/standalone.development.env

# Run the standalone gateway plus the adaptive PC/H5 dev ingress.
pnpm dev

# Run the standalone gateway directly (binds SDKWORK_DRAMA_HTTP_BIND).
cargo run -p sdkwork-api-drama-standalone-gateway

# Probe
curl http://127.0.0.1:8090/app/v3/api/system/health
curl http://127.0.0.1:8090/healthz

# Rust workspace
cargo build --workspace
cargo test --workspace

# Browser surfaces (standalone production artifacts)
pnpm run build:pc:prod
pnpm run build:h5:prod

# Generated TypeScript SDK (facade `@sdkwork/drama-app-sdk`)
pnpm install
pnpm --filter @sdkwork/drama-app-sdk-generated-typescript run build

# Baseline audit
node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .
```

## Application Surfaces

| Surface | Root | Dev ingress |
| --- | --- | --- |
| PC | `apps/sdkwork-drama-pc` | `SDKWORK_DRAMA_WEB_DEV_INGRESS_BIND` (proxies to `apps/sdkwork-drama-pc` renderer) |
| H5 | `apps/sdkwork-drama-h5` | same ingress, `h5` renderer selected by device class |

Both roots consume the generated SDK families through app-owned composition and publish their runtime document to `globalThis.SDKWORK_RUNTIME_ENV` (`BROWSER_RUNTIME_ENV_SPEC.md`). Device selection and renderer fallback are owned by `@sdkwork/app-topology` (`APP_RUNTIME_TOPOLOGY_SPEC.md` §8.2). See [`apps/README.md`](apps/README.md) for the surface index.

## API Contract And SDK

- Contract authority: `apis/open-api/drama/drama-app-api.openapi.json` (sdkwork-v3 wire protocol; envelope `{code: 0, data, traceId}`, problem+json failures).
- Consumers import the composed facade `@sdkwork/drama-app-sdk` (`sdks/sdkwork-drama-app-sdk/sdkwork-drama-app-sdk-typescript/src/index.ts`), never the generated transport.
- Contract changes require human review before SDK regeneration (`AGENTS.md` Human Review Rules).
