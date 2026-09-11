//! Domain model for drama media assets (L3 domain).
//!
//! An asset references bytes stored through SDKWork Drive by the stable
//! `drive://` URI; the drive space/node pair is the ownership anchor and the
//! optional bucket/key pair enables server-side readback through the drive
//! object store. Identity follows `SUBJECT_ID_SPEC.md` (snowflake int64).

use chrono::{DateTime, Utc};

/// Kind of media attached to an episode. Maps onto drive upload profiles.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MediaAssetKind {
    Cover,
    Video,
    Audio,
    Subtitle,
}

impl MediaAssetKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Cover => "cover",
            Self::Video => "video",
            Self::Audio => "audio",
            Self::Subtitle => "subtitle",
        }
    }

    /// Drive upload profile code consumed by the drive uploader service.
    pub fn upload_profile_code(&self) -> &'static str {
        match self {
            Self::Cover => "image",
            Self::Video => "video",
            Self::Audio => "audio",
            Self::Subtitle => "document",
        }
    }

    pub fn parse(raw: &str) -> Option<Self> {
        match raw {
            "cover" => Some(Self::Cover),
            "video" => Some(Self::Video),
            "audio" => Some(Self::Audio),
            "subtitle" => Some(Self::Subtitle),
            _ => None,
        }
    }
}

/// A media asset attached to an episode, stored through SDKWork Drive.
#[derive(Debug, Clone)]
pub struct MediaAsset {
    pub id: i64,
    pub tenant_id: i64,
    pub user_id: i64,
    pub episode_id: i64,
    pub kind: MediaAssetKind,
    /// Stable drive reference: `drive://spaces/{space_id}/nodes/{node_id}`.
    pub drive_uri: String,
    pub drive_space_id: String,
    pub drive_node_id: String,
    /// Storage coordinates for server-side readback through the drive
    /// object store (may be absent for external/presigned flows).
    pub object_bucket: Option<String>,
    pub object_key: Option<String>,
    pub file_name: String,
    pub content_type: String,
    pub content_length: i64,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
