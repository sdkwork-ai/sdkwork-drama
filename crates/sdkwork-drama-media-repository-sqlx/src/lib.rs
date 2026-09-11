//! SQLx/PostgreSQL adapter for the media asset persistence port (L4).
//!
//! Depends on the media service port crate only. Schema lifecycle is owned
//! by `database/` assets applied through `sdkwork-drama-database-host`.

use async_trait::async_trait;
use sqlx::PgPool;

use sdkwork_drama_media_service::{
    MediaAsset, MediaAssetKind, MediaAssetRepository, MediaStorageError,
};

/// Postgres-backed implementation of `MediaAssetRepository`.
pub struct PgMediaAssetRepository {
    pool: PgPool,
}

impl PgMediaAssetRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct MediaAssetRow {
    id: i64,
    tenant_id: i64,
    user_id: i64,
    episode_id: i64,
    asset_kind: String,
    drive_uri: String,
    drive_space_id: String,
    drive_node_id: String,
    object_bucket: Option<String>,
    object_key: Option<String>,
    file_name: String,
    content_type: String,
    content_length: i64,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl TryFrom<MediaAssetRow> for MediaAsset {
    type Error = MediaStorageError;

    fn try_from(row: MediaAssetRow) -> Result<Self, Self::Error> {
        let kind = MediaAssetKind::parse(&row.asset_kind).ok_or_else(|| {
            MediaStorageError::Storage(format!("unknown asset kind {}", row.asset_kind))
        })?;
        Ok(Self {
            id: row.id,
            tenant_id: row.tenant_id,
            user_id: row.user_id,
            episode_id: row.episode_id,
            kind,
            drive_uri: row.drive_uri,
            drive_space_id: row.drive_space_id,
            drive_node_id: row.drive_node_id,
            object_bucket: row.object_bucket,
            object_key: row.object_key,
            file_name: row.file_name,
            content_type: row.content_type,
            content_length: row.content_length,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }
}

fn map_err(err: sqlx::Error) -> MediaStorageError {
    tracing::error!(%err, "postgres media asset repository failure");
    MediaStorageError::Storage(err.to_string())
}

#[async_trait]
impl MediaAssetRepository for PgMediaAssetRepository {
    async fn insert(&self, asset: &MediaAsset) -> Result<(), MediaStorageError> {
        sqlx::query(
            "INSERT INTO drama_media_assets ( \
                id, tenant_id, user_id, episode_id, asset_kind, drive_uri, drive_space_id, \
                drive_node_id, object_bucket, object_key, file_name, content_type, \
                content_length, status, created_at, updated_at \
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
        )
        .bind(asset.id)
        .bind(asset.tenant_id)
        .bind(asset.user_id)
        .bind(asset.episode_id)
        .bind(asset.kind.as_str())
        .bind(&asset.drive_uri)
        .bind(&asset.drive_space_id)
        .bind(&asset.drive_node_id)
        .bind(&asset.object_bucket)
        .bind(&asset.object_key)
        .bind(&asset.file_name)
        .bind(&asset.content_type)
        .bind(asset.content_length)
        .bind(&asset.status)
        .bind(asset.created_at)
        .bind(asset.updated_at)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        tenant_id: i64,
        id: i64,
    ) -> Result<Option<MediaAsset>, MediaStorageError> {
        let row = sqlx::query_as::<_, MediaAssetRow>(
            "SELECT id, tenant_id, user_id, episode_id, asset_kind, drive_uri, drive_space_id, \
                    drive_node_id, object_bucket, object_key, file_name, content_type, \
                    content_length, status, created_at, updated_at \
             FROM drama_media_assets WHERE tenant_id = $1 AND id = $2",
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?;
        row.map(TryInto::try_into).transpose()
    }

    async fn list_by_episode(
        &self,
        tenant_id: i64,
        episode_id: i64,
    ) -> Result<Vec<MediaAsset>, MediaStorageError> {
        let rows = sqlx::query_as::<_, MediaAssetRow>(
            "SELECT id, tenant_id, user_id, episode_id, asset_kind, drive_uri, drive_space_id, \
                    drive_node_id, object_bucket, object_key, file_name, content_type, \
                    content_length, status, created_at, updated_at \
             FROM drama_media_assets \
             WHERE tenant_id = $1 AND episode_id = $2 \
             ORDER BY id ASC",
        )
        .bind(tenant_id)
        .bind(episode_id)
        .fetch_all(&self.pool)
        .await
        .map_err(map_err)?;
        rows.into_iter().map(TryInto::try_into).collect()
    }
}
