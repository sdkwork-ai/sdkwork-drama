# Baseline DDL

Baseline snapshots for the `drama` module. Fresh environments apply
`migrations/postgres/` in order; baselines are regenerated from the live
schema by drift tooling once the migration list grows beyond the initial
core migration.

Applying DDL to shared environments requires human review
(`AGENTS.md` Human Review Rules).
