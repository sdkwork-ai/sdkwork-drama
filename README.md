# sdkwork-drama

Short-drama (短剧) video creation application. Rust (`rust-axum`) backend following the SDKWork layered architecture, with OpenAPI contract authority under `apis/` and generated SDK families under `sdks/`.

- repository-kind: application
- Domain: `drama`
- Application code: `drama`
- Backend framework: `rust-axum`
- Deployment profiles: `standalone`, `cloud`
- Owned surface: `app-api` (dual-token protected; probes anonymous)

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

## Quick Start

```bash
# Source the standalone development profile (local Postgres placeholder).
source etc/topology/standalone.development.env

# Run the standalone gateway (binds SDKWORK_DRAMA_HTTP_BIND).
cargo run -p sdkwork-api-drama-standalone-gateway

# Probe
curl http://127.0.0.1:8090/app/v3/api/system/health
curl http://127.0.0.1:8090/healthz

# Rust workspace
cargo build --workspace
cargo test --workspace

# Generated TypeScript SDK (facade `@sdkwork/drama-app-sdk`)
pnpm install
pnpm --filter @sdkwork/drama-app-sdk-generated-typescript run build

# Baseline audit
node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .
```

## API Contract And SDK

- Contract authority: `apis/open-api/drama/drama-app-api.openapi.json` (sdkwork-v3 wire protocol; envelope `{code: 0, data, traceId}`, problem+json failures).
- Consumers import the composed facade `@sdkwork/drama-app-sdk` (`sdks/sdkwork-drama-app-sdk/sdkwork-drama-app-sdk-typescript/src/index.ts`), never the generated transport.
- Contract changes require human review before SDK regeneration (`AGENTS.md` Human Review Rules).
