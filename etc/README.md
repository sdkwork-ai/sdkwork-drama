# etc/

Purpose: safe source-controlled deployment/runtime configuration for independently deployable roots of the `drama` application (standalone gateway, assembly host). This is the concrete environment, Base URL, bind, topology, and packaging-input authority.

Owner: sdkwork-drama maintainers.

Allowed: environment-profile config files (dev/test/staging/production), bind addresses, topology manifests, packaging inputs — all non-secret values.

Forbidden: secrets (use a secret manager; `.env` files are git-ignored), runtime state, per-developer local overrides (use `.sdkwork/local/` which is git-ignored).

Related specs: `../sdkwork-specs/SOURCE_CONFIG_SPEC.md`, `../sdkwork-specs/CONFIG_SPEC.md`, `../sdkwork-specs/ENVIRONMENT_SPEC.md`, `../sdkwork-specs/DEPLOYMENT_SPEC.md`.

## Config Entrypoint

- Profile index: `sdkwork.deployment.config.json` — the only profile
  selector; each owned profile points at one file under `topology/`.
- Profile ids follow `<deployment-profile>.<environment>`
  (`SOURCE_CONFIG_SPEC.md`).

## Supported Profile Matrix

Drama declares a reduced matrix; its release contracts in
`sdkwork.workflow.json` package only these combinations. Selecting an
undeclared profile fails closed.

| Profile | File | Purpose |
| --- | --- | --- |
| `standalone.development` | `topology/standalone.development.env` | Local loopback development |
| `standalone.production` | `topology/standalone.production.env` | Standalone production deployment values |
| `cloud.development` | `topology/cloud.development.env` | Explicit cloud development endpoints |
| `cloud.production` | `topology/cloud.production.env` | Cloud production deployment values |

## Conventions

- **Consumption map** (only variables the process actually reads are
  declared in profiles):
  - `SDKWORK_ENV` / `SDKWORK_ENVIRONMENT` — IAM adapter environment
    detection (dev auth fallback) and lifecycle development defaults
    (`sdkwork-iam-web-adapter`, `sdkwork-drama-database-host`).
  - `SDKWORK_DRAMA_HTTP_BIND` — gateway listener bind address
    (`sdkwork-api-drama-standalone-gateway`).
  - `SDKWORK_DATABASE_URL|ENGINE|SCHEMA|AUTO_MIGRATE` — unified database
    framework pool and lifecycle (`SDKWORK_DATABASE_*` family, service code
    `DRAMA`); the same pool serves drama tables, Drive tables, and the
    `web_*` framework store tables.
  - `SDKWORK_DRAMA_APP_ROOT` — deployable root owning `database/` assets
    (fallback: repository root; set to `/app` in the cloud image).
  - `SDKWORK_WEB_STORE_APP_ROOT` — web-framework store module root
    (fallback: web-framework checkout; ship `database/` in images).
- **No live secrets in source.** Passwords, signing secrets, and private
  overrides stay in a secret manager or git-ignored local files. Database
  URLs here are local development placeholders only.
- Production-like environments never enable the IAM dev authentication
  fallback; dual tokens resolve through the IAM database session store.
- Local override policy: copy a topology file to a git-ignored location and
  source it manually; never commit per-developer values.

## Validation

- `node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .`
- Boot check: `cargo run -p sdkwork-api-drama-standalone-gateway` with the
  profile sourced, then probe `/app/v3/api/system/health` and `/healthz`.

<!-- SDKWORK-DEPLOY-LAYOUT: v1 -->
## Installed Runtime Paths

Authority: `APPLICATION_DEPLOY_LAYOUT_SPEC.md` (`../sdkwork-specs/`).

| Item | Value |
| --- | --- |
| `appId` | `sdkwork-drama` |
| `runtimeCode` | `drama` |
| Config root | `/etc/sdkwork/drama/` |
| Runtime TOML | `/etc/sdkwork/drama/config.toml` |
| Secrets | `/etc/sdkwork/drama/secrets/` |
| Override | `SDKWORK_DRAMA_CONFIG_FILE` |

Source profiles live under `etc/` (`sdkwork.deployment.config.json` index). Deploy manifest: `deployments/deploy.yaml`. Web data-plane source: `deployments/webserver/` (`SDKWORK_WEBSERVER_SPEC.md` layout v3).

```bash
node ../sdkwork-specs/tools/check-source-config-standard.mjs --root .
node ../sdkwork-specs/tools/check-application-deploy-layout.mjs --root .
node ../sdkwork-specs/tools/check-webserver-toml-standard.mjs --root deployments/webserver
```
<!-- /SDKWORK-DEPLOY-LAYOUT -->
