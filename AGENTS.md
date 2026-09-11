# Repository Guidelines

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing repository tasks.

## SDKWORK Standards

This repository follows `../sdkwork-specs/README.md`. Do not copy root standards locally.

Canonical SDKWORK specs path from this repository:

- `../sdkwork-specs/README.md`
- `../sdkwork-specs/SOUL.md`
- `../sdkwork-specs/AGENTS_SPEC.md`
- `../sdkwork-specs/CODE_STYLE_SPEC.md`
- `../sdkwork-specs/NAMING_SPEC.md`
- `../sdkwork-specs/RUST_CODE_SPEC.md`

If `../sdkwork-specs/` cannot be resolved from a standalone checkout, stop and report the unresolved path instead of guessing. Expected workspace layout: `sdkwork-drama` is a top-level sibling of `sdkwork-specs` under the same workspace root.

## Application Identity

Read `sdkwork.app.config.json` for application identity, registration, SDK/API inventory, release metadata, or app-owned capabilities. Read `etc/` for concrete environment, runtime, Base URL, bind, topology, and deployment values. Do not treat the app manifest as runtime configuration authority.

- Application code: `drama` (short-drama video creation application)
- Domain: `drama`; capability family: episode creation, publishing, playback
- Backend framework: Rust (`rust-axum`), layered per `../sdkwork-specs/COMPOSABLE_ARCHITECTURE_SPEC.md`
- App SDK consumer imports (app-owned names; integration rules live in `../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`): App API `@sdkwork/drama-app-sdk`, Backend API (`backend-admin` only) `@sdkwork/drama-backend-sdk`, Open/domain API `@sdkwork/drama-sdk`

## Local Dictionary Structure

- `AGENTS.md`: agent execution rules.
- `sdkwork.app.config.json`: application identity, app metadata, release surfaces, and owned capabilities.
- `.sdkwork/`: local skills, plugins, and repository AI workspace metadata.
- `apis/`: OpenAPI contract authority (`apis/open-api/`), the single source for API truth before route crates and SDK generation.
- `apps/`: application surfaces (web/desktop/mobile shells); indexed in `apps/README.md`.
- `crates/`: Rust crates (route/service/repository/assembly/gateway families).
- `sdks/`: SDK families, OpenAPI authorities, and generated outputs. Generated output is generator-owned (`../sdkwork-sdk-generator`); never hand-edit it.
- `etc/`: deployable-root source configuration; required only for independently deployable applications and process hosts.
- `scripts/`, `tools/`, `examples/`, `tests/`, `docs/`, `deployments/`, `database/`, `jobs/`, `plugins/`: standard dictionary directories per `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`.
- `specs/`: module-local spec systems for authored packages, crates, services, and SDK families; repository/application root `specs/` for cross-module machine contracts.
- `docs/`: Canon documentation at `docs/product/prd/PRD.md` and `docs/architecture/tech/TECH_ARCHITECTURE.md`.

## Spec Resolution Order

Resolve standards in this order:

1. Current or nearest `AGENTS.md`.
2. `sdkwork.app.config.json` when present.
3. Nearest module `specs/README.md` and `specs/component.spec.json` when the task touches an authored module.
4. Repository root `specs/` when the task is repository-wide.
5. Local `.sdkwork/README.md`, `.sdkwork/skills/`, and `.sdkwork/plugins/` when relevant.
6. Global `../sdkwork-specs/README.md` through the declared relative path.
7. Task-specific global specs referenced by the task matrix below.
8. Implementation files.

Loading is dynamic and progressive: load the nearest `AGENTS.md` and dictionary entries first, then only the root specs required by the current task. Do not eagerly load Rust, frontend, deployment, or SDK specs for unrelated work.

<!-- SDKWORK-NAMING-STANDARD: v1 -->
Rust naming and dependency declaration follow `../sdkwork-specs/NAMING_SPEC.md`. Internal sibling crates are declared in root `[workspace.dependencies]` with `{ path = "..." }` and referenced in member manifests with `{ workspace = true }`. Cross-repository dependencies use relative `../sdkwork-*` paths. This block is owned by `../sdkwork-specs/tools/sync-agent-naming-standard.mjs`; do not hand-edit between the markers.
<!-- /SDKWORK-NAMING-STANDARD: v1 -->

## Required Specs By Task Type

| Task | Required specs |
| --- | --- |
| Agent/workflow rules | `SOUL.md`, `AGENTS_SPEC.md`, `SDKWORK_WORKSPACE_SPEC.md` |
| Any code change | `CODE_STYLE_SPEC.md`, `NAMING_SPEC.md`, plus only the touched language/framework spec |
| Rust code | `RUST_CODE_SPEC.md` |
| Rust HTTP route crates / gateways | `COMPOSABLE_ARCHITECTURE_SPEC.md`, `API_SPEC.md`, `WEB_FRAMEWORK_SPEC.md`, `WEB_BACKEND_SPEC.md`, `RUST_CODE_SPEC.md`, `SECURITY_SPEC.md`, `TEST_SPEC.md` |
| API changes | `API_SPEC.md`, `PAGINATION_SPEC.md` when list/search pagination is touched, `WEB_FRAMEWORK_SPEC.md`, `WEB_BACKEND_SPEC.md`, `SDK_SPEC.md`, `APP_SDK_INTEGRATION_SPEC.md`, `TEST_SPEC.md` |
| Database changes | `DATABASE_SPEC.md`, `SUBJECT_ID_SPEC.md` when tenant/user subject columns are involved, `PRIVACY_SPEC.md`, `TEST_SPEC.md` |
| SDK generation/consumption | `COMPOSABLE_ARCHITECTURE_SPEC.md`, `SDK_SPEC.md`, `SDK_WORKSPACE_GENERATION_SPEC.md`, `API_SPEC.md`, `TEST_SPEC.md` |
| App identity/release | `APP_MANIFEST_SPEC.md`, `CONFIG_SPEC.md`, `DEPLOYMENT_SPEC.md` |
| Source config, environment profiles, or deployable-root `etc/` | `SOURCE_CONFIG_SPEC.md`, `CONFIG_SPEC.md`, `ENVIRONMENT_SPEC.md`, `DEPLOYMENT_SPEC.md`, `TEST_SPEC.md` |
| Security/auth | `IAM_SPEC.md`, `SUBJECT_ID_SPEC.md`, `SECURITY_SPEC.md`, `PRIVACY_SPEC.md` |

All spec paths resolve from `../sdkwork-specs/`. Language specs are on-demand; do not load unrelated language/framework specs.

## Code Style Rules

- Rust code follows `../sdkwork-specs/RUST_CODE_SPEC.md` and `../sdkwork-specs/CODE_STYLE_SPEC.md`.
- Naming follows `../sdkwork-specs/NAMING_SPEC.md` (crate names, handler functions `<verb>_<resource>`, module names).
- Scripts follow `../sdkwork-specs/CODE_STYLE_SPEC.md` §7 (Build Source Integrity) when build/dev/dependency tooling is touched.
- Formatting is enforced by `cargo fmt` and linting by `cargo clippy --workspace --all-targets -- -D warnings`.

## Build, Test, and Verification

- Rust workspace: `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`, `cargo build --workspace`.
- Repository baseline audit: `node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .`
- Agent workflow standard: `node ../sdkwork-specs/tools/check-agent-workflow-standard.mjs --root .`
- Repository docs standard: `node ../sdkwork-specs/tools/check-repository-docs-standard.mjs --root .`
- Route crate naming: `node ../sdkwork-specs/tools/audit-route-crate-naming-workspace.mjs --workspace .`
- List/search pagination standard: `node ../sdkwork-specs/tools/check-pagination.mjs --root .` (required for any pagination work per `../sdkwork-specs/PAGINATION_SPEC.md`)
- API operation patterns: `node ../sdkwork-specs/tools/check-api-operation-patterns.mjs --root .`
- HTTP response envelope section refresh (check-only): `node ../sdkwork-specs/tools/align-agents-http-response-standard.mjs --workspace .. --dryRun`
- App SDK consumer imports: `node ../sdkwork-specs/tools/check-app-sdk-consumer-imports.mjs --workspace ..`
- Command/package.json scripts follow `../sdkwork-specs/PNPM_SCRIPT_SPEC.md`; GitHub workflows follow `../sdkwork-specs/GITHUB_WORKFLOW_SPEC.md` when CI is added.

## Agent Execution Rules

- Read the nearest `AGENTS.md` first; never bypass the spec resolution order.
- Do not copy root spec bodies into local files; link them by relative path.
- Do not hand-edit generated SDK output under `sdks/**/generated/`; fix the generation chain and regenerate.
- Do not commit secrets; deployment/runtime configuration lives in `etc/` per `../sdkwork-specs/SOURCE_CONFIG_SPEC.md`.
- Verify every change with the commands in Build, Test, and Verification and record outputs.

## Human Review Rules

- External actions (publishing releases, sharing outside the workspace, modifying global `sdkwork-specs`) require explicit human confirmation.
- Contract changes to `apis/open-api/` require human review before SDK regeneration.
- Database DDL/baseline changes under `database/` require human review before applying to shared environments.
- Agents must not delete or rewrite Canon documents (`docs/product/prd/PRD.md`, `docs/architecture/tech/TECH_ARCHITECTURE.md`) without review.


## Deployment Standard (bin/)

Per `../sdkwork-specs/MODULE_BIN_SPEC.md`, this module ships the standardized
nine-entrypoint `bin/` family; all build/package/deploy/installer work `MUST`
go through them. See `bin/README.md` for the usage card and
`bin/lib/module.sh` for the delegation wiring (hooks not yet wired to a
canonical repository command fail fast with guidance).

- App types declared: see `SDKWORK_APP_TYPES` in `bin/lib/module.sh`;
  environments: `development`, `test`, `staging`, `demo`, `production`.
- Image reference: `registry.sdkwork.com/apps/<docker-name>:<version>`
  (`DOCKER_SPEC.md` §2.1; no `latest`, no env-suffixed tags).
- Authoritative specs: `MODULE_BIN_SPEC.md`, `DOCKER_SPEC.md`,
  `DEPLOYMENT_SPEC.md`, `OPERATIONS_SPEC.md`.
<!-- /SDKWORK-DEPLOYMENT-STANDARD: scaffolded -->

<!-- SDKWORK-DESTRUCTIVE-OPERATION-STANDARD: v1 -->
## Destructive Operation Safety

Authority: `../sdkwork-specs/DESTRUCTIVE_OPERATION_SPEC.md`.

Deletion must be explicit, enumerated, and reviewable. Deleting by pattern instead of by named
path is forbidden. Wildcards are for read-only commands only.

- `git rm -r`, `git rm` over a directory or pattern, and `git clean -f`/`-fd`/`-fdx` are
  FORBIDDEN. A recursive `git rm` stages many deletions in one index transaction; if the process
  is interrupted (SIGTERM, timeout, sandbox kill, crash) entries are already gone from disk while
  the index is only half-written, which is silent non-atomic mass data loss.
- Delete tracked files with `rm <exact/path>` on each named path, let `git status --short`
  record the `D` entries, then stage only the enumerated paths. Commit the deletion separately
  from functional changes.
- Shell and script deletion by wildcard is FORBIDDEN: `rm -rf`/`rm -r`/`rm -f` with
  `*`/`**`/`?`/`[...]`/brace expansion, `find ... -delete`, `find ... -exec rm`,
  `find ... | xargs rm`, `for f in *; do rm ...`, `del /S /Q`, `rd /S /Q`,
  `Remove-Item -Recurse -Force` on a glob, `shutil.rmtree`, `fs.rm(dir, { recursive: true })`,
  and `rimraf` over a glob.
- A deletion MUST NOT be combined in one shell invocation with a build, install, network, or
  publish step, and MUST NOT derive its targets from an unvalidated argument, environment
  variable, or configuration value.
- Permitted narrow deletion: `rm <exact/path>`; a short literal path list owned by the tool that
  declares it; the module's own generated artifacts through its owning tool
  (`pnpm clean`, `cargo clean`) per `CODE_STYLE_SPEC.md` §7; and
  `git restore --worktree --source=HEAD -- <exact paths>`.
- Required sequence before any deletion: enumerate exact paths; confirm every path resolves inside
  the active repository or module root; classify tracked/generated/cached/unknown; prefer `rm`
  plus tracked `git status`; delete in batches of 20 or fewer with a status check between
  batches; report the removed paths and the authorizing decision.
- Request explicit human confirmation before deleting any git-tracked path, any directory tree,
  any path resolving outside the active repository root, or more than 20 paths.
- Recovery after an accidental mass deletion: clear a stale `.git/index.lock`, write the path
  list to a file INSIDE the repository (never `/tmp` on Windows, where the Git Bash path space
  and the native tool path space disagree), and run a single
  `git restore --worktree --pathspec-from-file=<repo-relative-list>`. Never loop one
  version-control call per path; the same termination cause interrupts the loop part-way.

Verification (from the repository root):

```bash
node ../sdkwork-specs/tools/sync-agent-destructive-operation-standard.mjs --root . --check
```
<!-- /SDKWORK-DESTRUCTIVE-OPERATION-STANDARD: v1 -->
