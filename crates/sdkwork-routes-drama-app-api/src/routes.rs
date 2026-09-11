//! Router assembly for the drama app-api surface.
//!
//! The router owns business paths only, relative to the standard app API
//! prefix (`mount_path()`). The assembly nests it under the prefix, mounts
//! the standard health endpoints, and wraps the result in the IAM
//! web-framework layer.

use std::sync::Arc;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post};
use sdkwork_drama_episode_service::EpisodeService;
use sdkwork_drama_media_service::MediaService;

use crate::dto::MAX_UPLOAD_JSON_BODY_LIMIT_BYTES;
use crate::handlers::{
    DramaAppState, create_episode, create_episode_asset, delete_episode, get_episode,
    list_episode_assets, list_episodes, publish_episode, update_episode,
};

/// Build the drama app-api business router. The caller supplies the service
/// ports; wiring concrete repositories is the assembly's job, never this
/// crate's.
pub fn router(episodes: Arc<dyn EpisodeService>, media: Arc<dyn MediaService>) -> Router {
    let state = DramaAppState { episodes, media };
    Router::new()
        .route("/episodes", get(list_episodes).post(create_episode))
        .route(
            "/episodes/{episode_id}",
            get(get_episode)
                .patch(update_episode)
                .delete(delete_episode),
        )
        .route("/episodes/{episode_id}/publish", post(publish_episode))
        .route(
            "/episodes/{episode_id}/assets",
            get(list_episode_assets)
                .post(create_episode_asset)
                // Proxied uploads carry up to MAX_UPLOAD_BODY_BYTES; the
                // axum default body limit (2 MiB) must not reject them.
                .layer(DefaultBodyLimit::max(MAX_UPLOAD_JSON_BODY_LIMIT_BYTES)),
        )
        .with_state(state)
}

/// Standard mount point for this router (nested by the assembly).
pub fn mount_path() -> &'static str {
    crate::paths::APP_API_PREFIX
}
