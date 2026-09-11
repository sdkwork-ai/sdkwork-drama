//! `sdkwork-routes-drama-app-api`
//!
//! Route adapter crate for the drama app-api surface (L1 in the SDKWork
//! layered architecture). Depends only on the service port crates and the
//! web framework — never on repository crates or concrete infrastructure.
//!
//! Wire contract (`../sdkwork-specs/API_SPEC.md` §4.5, §14-16):
//! - success  -> `SdkWorkApiResponse` (`{code: 0, data, traceId}`) with the
//!   `X-SdkWork-Trace-Id` response header,
//! - failure  -> RFC 9457 `application/problem+json` (`SdkWorkProblemDetail`),
//! - listing  -> `SdkWorkPageData` (`{items, pageInfo}`) cursor pages.
//!
//! File layout per `../sdkwork-specs/WEB_BACKEND_SPEC.md` §3:
//! - `paths.rs`     — route path ownership constants
//! - `dto.rs`       — wire DTOs
//! - `error.rs`     — problem+json error mapping
//! - `response.rs`  — envelope helpers
//! - `manifest.rs`  — `HttpRouteManifest` (auth + operation inventory)
//! - `routes.rs`    — router assembly
//! - `handlers.rs`  — thin HTTP handlers

pub mod dto;
pub mod error;
pub mod handlers;
pub mod manifest;
pub mod paths;
pub mod response;
pub mod routes;

pub use dto::{
    CreateEpisodeRequest, CreateMediaAssetRequest, EpisodeResource, ListEpisodesQuery,
    MAX_UPLOAD_JSON_BODY_LIMIT_BYTES, MediaAssetResource, UpdateEpisodeRequest,
};
pub use error::DramaApiError;
pub use handlers::DramaAppState;
pub use manifest::route_manifest;
pub use paths::APP_API_PREFIX;
pub use routes::{mount_path, router};
