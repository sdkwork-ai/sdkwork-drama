# specs/ — sdkwork-drama-episode-service

Module-local spec system for the drama episode service crate.

## Component

- Name: `sdkwork-drama-episode-service`
- Layer: L2 service/use-case + L3 domain & ports (`backend-service`, `backend-domain`)
- Capability: `episode`

## Contracts

- Exposes: `EpisodeService` trait (consumed by route crates), `EpisodeRepository` port (implemented by infrastructure).
- Forbidden dependencies: any `*-repository-sqlx` crate, `axum` or any HTTP framework, route crate DTOs.
- Domain rules: only draft episodes may transition to published (enforced in `domain.rs`).
- Pagination: cursor-based per `../sdkwork-specs/PAGINATION_SPEC.md`; limit clamped to [1, 100], default 20.

## Verification

- `cargo clippy -p sdkwork-drama-episode-service --all-targets -- -D warnings`
- `cargo test -p sdkwork-drama-episode-service`
