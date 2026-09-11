//! `sdkwork-drama-media-drive`
//!
//! SDKWork Drive adapter for the drama media storage port (L4).
//!
//! Every drama file upload flows through the Drive uploader service
//! (`sdkwork-drive-uploader-service`): business code hands over bytes, this
//! adapter resolves the active storage provider, uploads through Drive, and
//! returns the stable `drive://` coordinates. Business code never talks to a
//! storage provider SDK directly — keeping file upload high-cohesion and
//! low-coupled from the episode capability.
//!
//! This crate also owns the embedded Drive schema bootstrap for standalone
//! deployments: the idempotent Drive core schema install and the local
//! filesystem storage provider seed (standalone profile only; cloud
//! deployments bring their own provider topology).

use async_trait::async_trait;
use sdkwork_drama_media_service::{
    MediaStorage, MediaStorageError, StoreMediaCommand, StoredMedia,
};
use sdkwork_drive_object_runtime::DriveObjectStoreRuntime;
use sdkwork_drive_storage_contract::DriveObjectStore;
use sdkwork_drive_uploader_service::service::{
    DriveUploaderService, PrepareUploaderUploadCommand, SqlUploaderStore, UploadBytesCommand,
    UploaderActor, UploaderRetention, UploaderTarget,
};
use sdkwork_drive_workspace_service::infrastructure::sql::storage_provider_store::SqlStorageProviderStore;
use sdkwork_drive_workspace_service::ports::storage_provider_store::DriveStorageProviderStore;
use sqlx::PgPool;

/// Application identity used for Drive ownership fields.
pub const DRAMA_APP_ID: &str = "sdkwork-drama";

/// Chunk size for proxied uploads (8 MiB, the Drive convention).
const CHUNK_SIZE_BYTES: i64 = 8 * 1024 * 1024;

/// Flatten a drive service error into a storage failure message (the enum
/// carries plain String payloads and no Display impl).
fn drive_error_message(err: sdkwork_drive_workspace_service::DriveServiceError) -> String {
    match err {
        sdkwork_drive_workspace_service::DriveServiceError::Validation(message) => message,
        sdkwork_drive_workspace_service::DriveServiceError::Conflict(message) => message,
        sdkwork_drive_workspace_service::DriveServiceError::NotFound(message) => message,
        sdkwork_drive_workspace_service::DriveServiceError::PermissionDenied(message) => message,
        sdkwork_drive_workspace_service::DriveServiceError::Internal(message) => message,
    }
}

/// Standalone-profile local storage provider coordinates.
pub const LOCAL_PROVIDER_ID: &str = "sdkwork-drama-local";
pub const LOCAL_PROVIDER_BUCKET: &str = "drama";

/// Drive-backed implementation of the media storage port.
pub struct DriveMediaStorage {
    pool: PgPool,
}

impl DriveMediaStorage {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn resolve_active_object_store(
        &self,
    ) -> Result<std::sync::Arc<dyn DriveObjectStore>, MediaStorageError> {
        let provider_store = SqlStorageProviderStore::new(self.pool.clone());
        let providers = provider_store
            .list_storage_providers(Some("active"), 0, 1)
            .await
            .map_err(|err| MediaStorageError::Storage(drive_error_message(err)))?;
        let provider = providers.first().ok_or_else(|| {
            MediaStorageError::Storage("no active drive storage provider configured".to_string())
        })?;
        let runtime = DriveObjectStoreRuntime::new(self.pool.clone());
        runtime
            .resolve(&provider.id, provider.version)
            .await
            .map_err(|err| MediaStorageError::Storage(err.to_string()))
    }
}

#[async_trait]
impl MediaStorage for DriveMediaStorage {
    async fn store(&self, command: StoreMediaCommand) -> Result<StoredMedia, MediaStorageError> {
        if command.body.is_empty() {
            return Err(MediaStorageError::Validation(
                "upload body must not be empty".to_string(),
            ));
        }
        let now_epoch_ms = sdkwork_utils_rust::to_unix_millis(sdkwork_utils_rust::now());
        let fingerprint = sdkwork_utils_rust::sha256_hash(&command.body);
        // Idempotency key: identical bytes for the same episode+kind reuse the
        // existing drive item instead of writing a duplicate object.
        let task_id = format!(
            "episode-{}-{}-{}",
            command.episode_id,
            command.kind.as_str(),
            &fingerprint[..fingerprint.len().min(24)]
        );
        let prepare = PrepareUploaderUploadCommand {
            id: format!("upload-{}", sdkwork_utils_rust::uuid()),
            task_id,
            tenant_id: command.tenant_id.to_string(),
            organization_id: None,
            actor: UploaderActor::User {
                user_id: command.user_id.to_string(),
            },
            app_id: DRAMA_APP_ID.to_string(),
            app_resource_type: format!("episode_{}", command.kind.as_str()),
            app_resource_id: command.episode_id.to_string(),
            scene: None,
            source: None,
            upload_profile_code: command.kind.upload_profile_code().to_string(),
            file_fingerprint: fingerprint,
            original_file_name: command.file_name,
            content_type: command.content_type,
            content_length: command.body.len() as i64,
            chunk_size_bytes: CHUNK_SIZE_BYTES,
            target: UploaderTarget::AutoUploadSpace {
                parent_node_id: None,
            },
            retention: UploaderRetention::LongTerm,
            operator_id: command.operator_id,
            now_epoch_ms,
        };

        let uploader = DriveUploaderService::new(SqlUploaderStore::new(self.pool.clone()));
        let object_store = self.resolve_active_object_store().await?;
        let item = uploader
            .upload_bytes(
                object_store.as_ref(),
                UploadBytesCommand {
                    prepare,
                    body: command.body,
                    uploaded_at_epoch_ms: now_epoch_ms,
                },
            )
            .await
            .map_err(|err| MediaStorageError::Storage(drive_error_message(err)))?;

        let drive_uri = format!("drive://spaces/{}/nodes/{}", item.space_id, item.node_id);
        tracing::info!(drive_uri = %drive_uri, "drama media stored through drive");
        Ok(StoredMedia {
            drive_space_id: item.space_id,
            drive_node_id: item.node_id,
            drive_uri,
            object_bucket: item.object_bucket,
            object_key: item.object_key,
        })
    }
}

/// Install the embedded Drive core schema (idempotent) and seed the
/// standalone local filesystem storage provider when no active provider
/// exists yet.
///
/// Cloud deployments provision their own provider records and topology; the
/// seed here only guarantees a working standalone/dev configuration.
pub async fn bootstrap_drive_storage(pool: &PgPool) -> Result<(), sqlx::Error> {
    sdkwork_drive_workspace_service::infrastructure::sql::install_postgres_schema(pool).await?;
    seed_local_storage_provider_if_absent(pool).await
}

async fn seed_local_storage_provider_if_absent(pool: &PgPool) -> Result<(), sqlx::Error> {
    let existing: Option<i64> = sqlx::query_scalar(
        "SELECT 1::bigint FROM dr_drive_storage_provider WHERE status = 'active'",
    )
    .fetch_optional(pool)
    .await?;
    if existing.is_some() {
        return Ok(());
    }
    tracing::info!(
        provider_id = LOCAL_PROVIDER_ID,
        "seeding standalone local drive storage provider"
    );
    sqlx::query(
        "INSERT INTO dr_drive_storage_provider ( \
                id, provider_kind, name, endpoint_url, region, bucket, path_style, \
                strict_tls, credential_ref, server_side_encryption_mode, default_storage_class, \
                status, version, created_by, updated_by \
            ) VALUES ( \
                $1, 'local_filesystem', $2, 'file://localhost', 'local', $2, TRUE, TRUE, \
                'plain:local:local', NULL, NULL, 'active', 1, 'system', 'system' \
            )",
    )
    .bind(LOCAL_PROVIDER_ID)
    .bind(LOCAL_PROVIDER_BUCKET)
    .execute(pool)
    .await?;
    Ok(())
}
