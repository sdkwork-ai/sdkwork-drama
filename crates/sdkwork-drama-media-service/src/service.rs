//! Media service (L2 use-case layer).
//!
//! Orchestrates episode asset uploads: verifies the episode exists under the
//! caller's tenant, delegates byte storage through the `MediaStorage` port
//! (SDKWork Drive adapter at the assembly), and persists the resulting asset
//! record. Storage failures propagate — never masked as success.

use std::sync::Arc;

use async_trait::async_trait;
use chrono::Utc;
use sdkwork_database_id::SnowflakeIdGenerator;
use sdkwork_drama_episode_service::EpisodeRepository;

use crate::domain::MediaAsset;
use crate::port::{MediaAssetRepository, MediaStorage, StoreMediaCommand, UploadMediaCommand};

/// Upper bound for a single proxied upload body (64 MiB decoded). Larger
/// episode videos must move to the drive presigned direct-upload flow, which
/// bypasses the application process entirely.
pub const MAX_UPLOAD_BODY_BYTES: i64 = 64 * 1024 * 1024;

/// Service port consumed by route crates.
#[async_trait]
pub trait MediaService: Send + Sync {
    async fn create_asset(
        &self,
        tenant_id: i64,
        user_id: i64,
        episode_id: i64,
        command: UploadMediaCommand,
    ) -> Result<MediaAsset, MediaServiceError>;
    async fn list_assets(
        &self,
        tenant_id: i64,
        episode_id: i64,
    ) -> Result<Vec<MediaAsset>, MediaServiceError>;
}

/// Business failure surfaced to the transport layer.
#[derive(Debug, thiserror::Error)]
pub enum MediaServiceError {
    #[error("episode not found")]
    EpisodeNotFound,
    #[error("media asset not found")]
    NotFound,
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("storage failure")]
    Storage(#[source] crate::port::MediaStorageError),
}

pub struct DefaultMediaService {
    storage: Arc<dyn MediaStorage>,
    assets: Arc<dyn MediaAssetRepository>,
    episodes: Arc<dyn EpisodeRepository>,
    ids: Arc<SnowflakeIdGenerator>,
}

impl DefaultMediaService {
    pub fn new(
        storage: Arc<dyn MediaStorage>,
        assets: Arc<dyn MediaAssetRepository>,
        episodes: Arc<dyn EpisodeRepository>,
        ids: Arc<SnowflakeIdGenerator>,
    ) -> Self {
        Self {
            storage,
            assets,
            episodes,
            ids,
        }
    }
}

#[async_trait]
impl MediaService for DefaultMediaService {
    async fn create_asset(
        &self,
        tenant_id: i64,
        user_id: i64,
        episode_id: i64,
        command: UploadMediaCommand,
    ) -> Result<MediaAsset, MediaServiceError> {
        if command.body.is_empty() {
            return Err(MediaServiceError::Validation(
                "upload body must not be empty".to_string(),
            ));
        }
        if command.body.len() as i64 > MAX_UPLOAD_BODY_BYTES {
            return Err(MediaServiceError::Validation(format!(
                "upload body exceeds {} bytes",
                MAX_UPLOAD_BODY_BYTES
            )));
        }
        let file_name = command.file_name.trim();
        if file_name.is_empty() {
            return Err(MediaServiceError::Validation(
                "file name must not be blank".to_string(),
            ));
        }
        let content_type = command.content_type.trim();
        if content_type.is_empty() {
            return Err(MediaServiceError::Validation(
                "content type must not be blank".to_string(),
            ));
        }

        // Tenant scope check: the episode must exist under the caller's
        // tenant before any bytes are stored.
        self.episodes
            .find_by_id(tenant_id, episode_id)
            .await
            .map_err(|err| {
                MediaServiceError::Storage(crate::port::MediaStorageError::Storage(err.to_string()))
            })?
            .ok_or(MediaServiceError::EpisodeNotFound)?;

        let content_length = command.body.len() as i64;
        let stored = self
            .storage
            .store(StoreMediaCommand {
                tenant_id,
                user_id,
                episode_id,
                kind: command.kind,
                file_name: file_name.to_string(),
                content_type: content_type.to_string(),
                body: command.body,
                operator_id: user_id.to_string(),
            })
            .await
            .map_err(MediaServiceError::Storage)?;

        let id = self.ids.generate().map_err(|err| {
            MediaServiceError::Storage(crate::port::MediaStorageError::Storage(err.to_string()))
        })?;
        let now = Utc::now();
        let asset = MediaAsset {
            id,
            tenant_id,
            user_id,
            episode_id,
            kind: command.kind,
            drive_uri: stored.drive_uri,
            drive_space_id: stored.drive_space_id,
            drive_node_id: stored.drive_node_id,
            object_bucket: stored.object_bucket,
            object_key: stored.object_key,
            file_name: file_name.to_string(),
            content_type: content_type.to_string(),
            content_length,
            status: "ready".to_string(),
            created_at: now,
            updated_at: now,
        };
        self.assets
            .insert(&asset)
            .await
            .map_err(MediaServiceError::Storage)?;
        Ok(asset)
    }

    async fn list_assets(
        &self,
        tenant_id: i64,
        episode_id: i64,
    ) -> Result<Vec<MediaAsset>, MediaServiceError> {
        Ok(self
            .assets
            .list_by_episode(tenant_id, episode_id)
            .await
            .map_err(MediaServiceError::Storage)?)
    }
}
