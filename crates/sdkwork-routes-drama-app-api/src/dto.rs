//! Wire DTOs for the drama app-api surface.
//!
//! These types belong to the route layer only. Domain types live in the
//! service crates; repository rows live in the repository crates. Snowflake
//! int64 ids serialize as JSON strings per `SUBJECT_ID_SPEC.md`.

use chrono::{DateTime, Utc};
use sdkwork_drama_episode_service as episode;
use sdkwork_drama_media_service as media;
use serde::{Deserialize, Serialize};

/// Query parameters for `GET /app/v3/api/episodes` (cursor pagination per
/// `../sdkwork-specs/PAGINATION_SPEC.md`).
#[derive(Debug, Clone, Deserialize)]
pub struct ListEpisodesQuery {
    pub cursor: Option<String>,
    pub page_size: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateEpisodeRequest {
    pub title: String,
    pub synopsis: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateEpisodeRequest {
    pub title: Option<String>,
    pub synopsis: Option<String>,
}

/// Upper bound for the upload request JSON body: the base64 encoding of the
/// 64 MiB decoded cap (~85.3 MiB) plus JSON envelope overhead.
pub const MAX_UPLOAD_JSON_BODY_LIMIT_BYTES: usize = 96 * 1024 * 1024;

/// Request body for `POST /app/v3/api/episodes/{episodeId}/assets`.
///
/// File bytes travel as canonical base64 JSON per the platform content
/// payload idiom (`SDK_WORKSPACE_GENERATION_SPEC`-compatible contracts carry
/// JSON bodies only).
#[derive(Debug, Clone, Deserialize)]
pub struct CreateMediaAssetRequest {
    /// Asset kind: `cover`, `video`, `audio`, or `subtitle`.
    pub kind: String,
    /// Original file name.
    pub file_name: String,
    /// File media type (stored and forwarded to Drive).
    pub content_type: String,
    /// File bytes encoded per `encoding`.
    pub content: String,
    /// Content encoding; only `base64` is accepted.
    pub encoding: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct EpisodeResource {
    #[serde(with = "sdkwork_utils_rust::serde_int64")]
    pub id: i64,
    #[serde(with = "sdkwork_utils_rust::serde_int64")]
    pub tenant_id: i64,
    pub title: String,
    pub synopsis: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<episode::Episode> for EpisodeResource {
    fn from(value: episode::Episode) -> Self {
        Self {
            id: value.id,
            tenant_id: value.tenant_id,
            title: value.title,
            synopsis: value.synopsis,
            status: value.status.as_str().to_string(),
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct MediaAssetResource {
    #[serde(with = "sdkwork_utils_rust::serde_int64")]
    pub id: i64,
    #[serde(with = "sdkwork_utils_rust::serde_int64")]
    pub episode_id: i64,
    pub kind: String,
    pub drive_uri: String,
    pub file_name: String,
    pub content_type: String,
    #[serde(with = "sdkwork_utils_rust::serde_int64")]
    pub content_length: i64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

impl From<media::MediaAsset> for MediaAssetResource {
    fn from(value: media::MediaAsset) -> Self {
        Self {
            id: value.id,
            episode_id: value.episode_id,
            kind: value.kind.as_str().to_string(),
            drive_uri: value.drive_uri,
            file_name: value.file_name,
            content_type: value.content_type,
            content_length: value.content_length,
            status: value.status,
            created_at: value.created_at,
        }
    }
}

impl From<CreateEpisodeRequest> for episode::CreateEpisode {
    fn from(value: CreateEpisodeRequest) -> Self {
        episode::CreateEpisode::new(value.title, value.synopsis)
    }
}

impl From<UpdateEpisodeRequest> for episode::UpdateEpisode {
    fn from(value: UpdateEpisodeRequest) -> Self {
        episode::UpdateEpisode {
            title: value.title,
            synopsis: value.synopsis,
        }
    }
}
