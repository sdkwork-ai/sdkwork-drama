# specs/ — sdkwork-drama-episode-repository-sqlx

Module-local spec system for the drama episode SQLx repository crate.

## Component

- Name: `sdkwork-drama-episode-repository-sqlx`
- Layer: L4 infrastructure adapter (`backend-repository`)
- Capability: `episode`

## Contracts

- Implements: `sdkwork_drama_episode_service::EpisodeRepository`.
- Forbidden dependencies: `axum` or any HTTP framework, route crates, assembly/gateway crates.
- Table ownership: `drama.episodes` (schema `drama`, DDL authority under `database/`).
- Cursor pagination: `WHERE id > $cursor ORDER BY id ASC LIMIT $n` (UUIDv7 time-ordered).
- Status decoding is defensive; the domain crate owns the authoritative status set.

## Verification

- `cargo clippy -p sdkwork-drama-episode-repository-sqlx --all-targets -- -D warnings`
- `cargo tree -p sdkwork-drama-episode-repository-sqlx` must not contain `axum`.
