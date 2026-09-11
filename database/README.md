# database/

Purpose: database lifecycle ownership for the `drama` application — DDL contract, migrations, baselines, seeds, and drift policy for PostgreSQL.

Owner: sdkwork-drama maintainers.

Allowed: `contract/` DDL authority, `ddl/`, `baseline/`, `postgres/`, `migrations/postgres/`, `seeds/`, `drift/policy.yaml`, `fixtures/`.

Forbidden: hand-applying DDL to shared environments without review, tenant/user subject columns without `SUBJECT_ID_SPEC.md` alignment, secrets.

Related specs: `../sdkwork-specs/DATABASE_SPEC.md`, `../sdkwork-specs/SUBJECT_ID_SPEC.md`, `../sdkwork-specs/PRIVACY_SPEC.md`.

Verification: review migrations in human review before applying; drift policy checked in CI when pipeline lands.
