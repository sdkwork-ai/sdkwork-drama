//! SQLx/PostgreSQL adapter for the episode persistence port (L4).
//!
//! This crate depends on the service port crate only. It must never depend
//! on axum or route crates; the API assembly wires it into the service.
//! Schema lifecycle (DDL/migrations) is owned by `database/` assets applied
//! through `sdkwork-drama-database-host` — this adapter never executes DDL.

use async_trait::async_trait;
use sqlx::PgPool;

use sdkwork_drama_episode_service::{Episode, EpisodeRepository, EpisodeStatus, RepositoryError};

/// Postgres-backed implementation of `EpisodeRepository`.
///
/// Every statement is tenant-scoped: `tenant_id` participates in the lookup
/// predicate, so a valid id from another tenant is indistinguishable from a
/// missing row.
pub struct PgEpisodeRepository {
    pool: PgPool,
}

impl PgEpisodeRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct EpisodeRow {
    id: i64,
    tenant_id: i64,
    user_id: i64,
    title: String,
    synopsis: Option<String>,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<EpisodeRow> for Episode {
    fn from(row: EpisodeRow) -> Self {
        // Unknown status strings are defensive-decoded to Draft; the domain
        // owns the authoritative set of statuses.
        let status = match row.status.as_str() {
            "published" => EpisodeStatus::Published,
            "retired" => EpisodeStatus::Retired,
            _ => EpisodeStatus::Draft,
        };
        Self {
            id: row.id,
            tenant_id: row.tenant_id,
            user_id: row.user_id,
            title: row.title,
            synopsis: row.synopsis,
            status,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

fn map_err(err: sqlx::Error) -> RepositoryError {
    tracing::error!(%err, "postgres episode repository failure");
    match &err {
        sqlx::Error::Database(db) if db.constraint().is_some() => {
            RepositoryError::Conflict(db.constraint().unwrap_or("unknown").to_string())
        }
        _ => RepositoryError::Unavailable(err.to_string()),
    }
}

#[async_trait]
impl EpisodeRepository for PgEpisodeRepository {
    async fn insert(&self, episode: &Episode) -> Result<(), RepositoryError> {
        sqlx::query(
            "INSERT INTO episodes (id, tenant_id, user_id, title, synopsis, status, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        )
        .bind(episode.id)
        .bind(episode.tenant_id)
        .bind(episode.user_id)
        .bind(&episode.title)
        .bind(&episode.synopsis)
        .bind(episode.status.as_str())
        .bind(episode.created_at)
        .bind(episode.updated_at)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(())
    }

    async fn find_by_id(
        &self,
        tenant_id: i64,
        id: i64,
    ) -> Result<Option<Episode>, RepositoryError> {
        let row = sqlx::query_as::<_, EpisodeRow>(
            "SELECT id, tenant_id, user_id, title, synopsis, status, created_at, updated_at \
             FROM episodes WHERE tenant_id = $1 AND id = $2",
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(row.map(Into::into))
    }

    async fn list(
        &self,
        tenant_id: i64,
        cursor: Option<i64>,
        limit: i64,
    ) -> Result<Vec<Episode>, RepositoryError> {
        let rows = sqlx::query_as::<_, EpisodeRow>(
            "SELECT id, tenant_id, user_id, title, synopsis, status, created_at, updated_at \
             FROM episodes \
             WHERE tenant_id = $1 AND ($2::bigint IS NULL OR id > $2) \
             ORDER BY id ASC \
             LIMIT $3",
        )
        .bind(tenant_id)
        .bind(cursor)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(map_err)?;
        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn update(&self, episode: &Episode) -> Result<(), RepositoryError> {
        let result = sqlx::query(
            "UPDATE episodes \
             SET title = $3, synopsis = $4, status = $5, updated_at = $6 \
             WHERE tenant_id = $1 AND id = $2",
        )
        .bind(episode.tenant_id)
        .bind(episode.id)
        .bind(&episode.title)
        .bind(&episode.synopsis)
        .bind(episode.status.as_str())
        .bind(episode.updated_at)
        .execute(&self.pool)
        .await
        .map_err(map_err)?;
        if result.rows_affected() == 0 {
            return Err(RepositoryError::Unavailable(format!(
                "episode {} not found for update",
                episode.id
            )));
        }
        Ok(())
    }

    async fn delete(&self, tenant_id: i64, id: i64) -> Result<bool, RepositoryError> {
        let result = sqlx::query("DELETE FROM episodes WHERE tenant_id = $1 AND id = $2")
            .bind(tenant_id)
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(map_err)?;
        Ok(result.rows_affected() > 0)
    }
}
