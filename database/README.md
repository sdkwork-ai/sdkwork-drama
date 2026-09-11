# drama database module

Canonical authoritative-server lifecycle assets for the `drama` application under `DATABASE_FRAMEWORK_SPEC.md`.

- `databaseRole`: `authoritative-server`
- `moduleId`: `drama`
- `serviceCode`: `DRAMA`
- `owner`: `sdkwork-drama`
- `compliance_level`: `L3`
- `engine`: PostgreSQL only
- `autoMigrate`: disabled by default

Purpose: database lifecycle ownership for the `drama` application — DDL contract, migrations, baselines, seeds, and drift policy for PostgreSQL.

Allowed: `contract/` DDL authority, `ddl/`, `baseline/`, `postgres/`, `migrations/postgres/`, `seeds/`, `drift/policy.yaml`, `fixtures/`.

Forbidden: hand-applying DDL to shared environments without review, tenant/user subject columns without `SUBJECT_ID_SPEC.md` alignment, secrets.

## Initialization state

This module is in initialization state per `DATABASE_FRAMEWORK_SPEC.md` section 7.5.

- `baselineStrategy`: `migrations-only`
- Primary baseline: none. `migrations/postgres/0001_drama_core.up.sql` is the ordered bootstrap set that initializes an empty database; a baseline snapshot is optional for `migrations-only` and is not an alternate production bootstrap path.
- Ordered migrations: `0001_drama_core.up.sql` (tracked, immutable, checksum-covered) with per-file metadata in `migrations/postgres/metadata.json`.
- Seeds: `common` plus the `zh-CN` default locale; the remaining locales are reserved placeholders per section 8.1.
- Consolidation level: no baseline exists, so nothing has been folded into one and no tracked migration has been rewritten.

## Commands

```bash
pnpm run db:validate
pnpm run db:plan
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
pnpm run db:bootstrap
```

`db:validate` runs the canonical validator `../sdkwork-specs/tools/check-database-framework-standard.mjs --root .`.

## Related specifications

- `../sdkwork-specs/DATABASE_FRAMEWORK_SPEC.md` — database module layout, initialization state, governance.
- `../sdkwork-specs/DATABASE_SPEC.md` — relational data, naming, and table authority rules.
- `../sdkwork-specs/MIGRATION_SPEC.md` — schema version migration records and compatibility windows.
- `../sdkwork-specs/SUBJECT_ID_SPEC.md` — tenant/user subject column rules.
- `../sdkwork-specs/PRIVACY_SPEC.md` — privacy and retention rules.

Verification: review migrations in human review before applying; `db:validate` and `db:drift:check` run in CI.
