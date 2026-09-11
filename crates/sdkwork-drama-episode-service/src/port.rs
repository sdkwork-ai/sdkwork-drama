//! Port definition for episode persistence (L3 -> L4 boundary).
//!
//! The service layer depends on this trait only. The SQLx adapter
//! (`sdkwork-drama-episode-repository-sqlx`) implements it; the API assembly
//! injects the concrete implementation. The service crate never depends on
//! the repository crate. Every operation is tenant-scoped: the tenant
//! subject comes from validated request context, never from client input
//! (`SUBJECT_ID_SPEC.md`).

use async_trait::async_trait;

use crate::domain::Episode;

/// Request to create a draft episode (service-layer input, not a wire DTO).
#[derive(Debug, Clone)]
pub struct CreateEpisode {
    pub title: String,
    pub synopsis: Option<String>,
}

impl CreateEpisode {
    pub fn new(title: impl Into<String>, synopsis: Option<String>) -> Self {
        Self {
            title: title.into(),
            synopsis,
        }
    }
}

/// Patch for updating an episode.
#[derive(Debug, Clone, Default)]
pub struct UpdateEpisode {
    pub title: Option<String>,
    pub synopsis: Option<String>,
}

/// Persistence port for episodes.
#[async_trait]
pub trait EpisodeRepository: Send + Sync {
    async fn insert(&self, episode: &Episode) -> Result<(), RepositoryError>;
    async fn find_by_id(&self, tenant_id: i64, id: i64)
    -> Result<Option<Episode>, RepositoryError>;
    /// Cursor-based list ordered by `id` ascending (snowflake ids are time-ordered).
    async fn list(
        &self,
        tenant_id: i64,
        cursor: Option<i64>,
        limit: i64,
    ) -> Result<Vec<Episode>, RepositoryError>;
    async fn update(&self, episode: &Episode) -> Result<(), RepositoryError>;
    async fn delete(&self, tenant_id: i64, id: i64) -> Result<bool, RepositoryError>;
}

/// Storage failure surfaced through the port. Infrastructure details stay
/// behind the adapter boundary.
#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("storage unavailable: {0}")]
    Unavailable(String),
    #[error("conflict: {0}")]
    Conflict(String),
}
