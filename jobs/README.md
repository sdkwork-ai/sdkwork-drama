# jobs/

Purpose: scheduled and background jobs owned by the `drama` application (e.g. transcoding dispatch, publishing sweeps).

Owner: sdkwork-drama maintainers.

Allowed: job crates or scripts registered with the runtime topology; each job documents its trigger and idempotency.

Forbidden: hidden business logic bypassing the service layer, secrets.

Related specs: `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`, `../sdkwork-specs/COMPOSABLE_ARCHITECTURE_SPEC.md`.

Verification: `cargo build --workspace`
