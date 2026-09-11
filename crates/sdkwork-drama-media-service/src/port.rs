//! Ports for the media capability (L3 -> L4 boundaries).
//!
//! - `MediaStorage` abstracts byte storage; the only shipped adapter writes
//!   through SDKWork Drive (`sdkwork-drama-media-drive`), keeping file
//!   upload high-cohesion and low-coupled from business code.
//! - `MediaAssetRepository` abstracts asset persistence.

use async_trait::async_trait;

use crate::domain::{MediaAsset, MediaAssetKind};

/// Command for storing one upload through the storage port.
#[derive(Debug, Clone)]
pub struct StoreMediaCommand {
    pub tenant_id: i64,
    pub user_id: i64,
    pub episode_id: i64,
    pub kind: MediaAssetKind,
    pub file_name: String,
    pub content_type: String,
    pub body: Vec<u8>,
    pub operator_id: String,
}

/// Storage coordinates returned by the storage port after a successful
/// upload.
#[derive(Debug, Clone)]
pub struct StoredMedia {
    pub drive_space_id: String,
    pub drive_node_id: String,
    pub drive_uri: String,
    pub object_bucket: Option<String>,
    pub object_key: Option<String>,
}

/// Storage failure surfaced through the port.
#[derive(Debug, thiserror::Error)]
pub enum MediaStorageError {
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("storage failure: {0}")]
    Storage(String),
}

/// Byte storage port. Business code never talks to a storage provider SDK
/// directly — implementations funnel through SDKWork Drive.
#[async_trait]
pub trait MediaStorage: Send + Sync {
    async fn store(&self, command: StoreMediaCommand) -> Result<StoredMedia, MediaStorageError>;
}

/// Route-layer upload request (validated by the service before storage).
#[derive(Debug, Clone)]
pub struct UploadMediaCommand {
    pub kind: MediaAssetKind,
    pub file_name: String,
    pub content_type: String,
    pub body: Vec<u8>,
}

/// Persistence port for media assets.
#[async_trait]
pub trait MediaAssetRepository: Send + Sync {
    async fn insert(&self, asset: &MediaAsset) -> Result<(), MediaStorageError>;
    async fn find_by_id(
        &self,
        tenant_id: i64,
        id: i64,
    ) -> Result<Option<MediaAsset>, MediaStorageError>;
    async fn list_by_episode(
        &self,
        tenant_id: i64,
        episode_id: i64,
    ) -> Result<Vec<MediaAsset>, MediaStorageError>;
}
