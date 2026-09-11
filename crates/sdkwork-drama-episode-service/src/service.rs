//! Episode service (L2 use-case layer).
//!
//! Owns business rules for episodes and depends only on the domain model and
//! the persistence port. The route crate consumes this trait object; the API
//! assembly injects the concrete repository adapter. Errors propagate to the
//! route layer as `EpisodeServiceError` — the service never swallows storage
//! failures or converts them into fake success payloads.

use std::sync::Arc;

use async_trait::async_trait;
use sdkwork_database_id::SnowflakeIdGenerator;

use crate::domain::{Episode, EpisodeError};
use crate::port::{CreateEpisode, EpisodeRepository, RepositoryError, UpdateEpisode};

/// Default and clamp bounds for cursor listing (`PAGINATION_SPEC.md`).
pub const DEFAULT_LIST_LIMIT: i64 = 20;
pub const MAX_LIST_LIMIT: i64 = 100;

/// One page of a keyset cursor listing.
#[derive(Debug, Clone)]
pub struct EpisodePage {
    pub items: Vec<Episode>,
    /// Opaque cursor (decimal snowflake id) for the next page, when more
    /// items exist.
    pub next_cursor: Option<String>,
    pub has_more: bool,
}

/// Service port consumed by route crates. Signature-level contract only —
/// no HTTP types leak here.
#[async_trait]
pub trait EpisodeService: Send + Sync {
    async fn list(
        &self,
        tenant_id: i64,
        cursor: Option<String>,
        limit: Option<i64>,
    ) -> Result<EpisodePage, EpisodeServiceError>;
    async fn get(&self, tenant_id: i64, id: i64) -> Result<Episode, EpisodeServiceError>;
    async fn create(
        &self,
        tenant_id: i64,
        user_id: i64,
        request: CreateEpisode,
    ) -> Result<Episode, EpisodeServiceError>;
    async fn update(
        &self,
        tenant_id: i64,
        id: i64,
        patch: UpdateEpisode,
    ) -> Result<Episode, EpisodeServiceError>;
    async fn delete(&self, tenant_id: i64, id: i64) -> Result<(), EpisodeServiceError>;
    async fn publish(&self, tenant_id: i64, id: i64) -> Result<Episode, EpisodeServiceError>;
}

/// Business failure surfaced to the transport layer. The route adapter maps
/// each variant onto the standard `SdkWorkResultCode` problem response.
#[derive(Debug, thiserror::Error)]
pub enum EpisodeServiceError {
    #[error("episode not found")]
    NotFound,
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("storage failure")]
    Storage(#[source] RepositoryError),
}

/// Default implementation backed by the persistence port and the platform
/// snowflake id generator (`SUBJECT_ID_SPEC.md` identity family).
pub struct DefaultEpisodeService {
    repository: Arc<dyn EpisodeRepository>,
    ids: Arc<SnowflakeIdGenerator>,
}

impl DefaultEpisodeService {
    pub fn new(repository: Arc<dyn EpisodeRepository>, ids: Arc<SnowflakeIdGenerator>) -> Self {
        Self { repository, ids }
    }

    fn next_id(&self) -> Result<i64, EpisodeServiceError> {
        self.ids.generate().map_err(|err| {
            EpisodeServiceError::Storage(RepositoryError::Unavailable(err.to_string()))
        })
    }
}

#[async_trait]
impl EpisodeService for DefaultEpisodeService {
    async fn list(
        &self,
        tenant_id: i64,
        cursor: Option<String>,
        limit: Option<i64>,
    ) -> Result<EpisodePage, EpisodeServiceError> {
        let cursor = match cursor {
            Some(raw) => Some(raw.parse::<i64>().map_err(|_| {
                EpisodeServiceError::Validation("cursor must be a decimal id".to_string())
            })?),
            None => None,
        };
        let limit = limit.unwrap_or(DEFAULT_LIST_LIMIT).clamp(1, MAX_LIST_LIMIT);
        // Fetch one extra row to compute has_more without a count query.
        let mut items = self
            .repository
            .list(tenant_id, cursor, limit.saturating_add(1))
            .await
            .map_err(EpisodeServiceError::Storage)?;
        let has_more = items.len() as i64 > limit;
        if has_more {
            items.truncate(limit as usize);
        }
        let next_cursor = if has_more {
            items.last().map(|episode| episode.id.to_string())
        } else {
            None
        };
        Ok(EpisodePage {
            items,
            next_cursor,
            has_more,
        })
    }

    async fn get(&self, tenant_id: i64, id: i64) -> Result<Episode, EpisodeServiceError> {
        self.repository
            .find_by_id(tenant_id, id)
            .await
            .map_err(EpisodeServiceError::Storage)?
            .ok_or(EpisodeServiceError::NotFound)
    }

    async fn create(
        &self,
        tenant_id: i64,
        user_id: i64,
        request: CreateEpisode,
    ) -> Result<Episode, EpisodeServiceError> {
        let title = request.title.trim();
        if title.is_empty() {
            return Err(EpisodeServiceError::Validation(
                "title must not be blank".to_string(),
            ));
        }
        let id = self.next_id()?;
        let episode = Episode::new_draft(id, tenant_id, user_id, title, request.synopsis);
        self.repository
            .insert(&episode)
            .await
            .map_err(EpisodeServiceError::Storage)?;
        Ok(episode)
    }

    async fn update(
        &self,
        tenant_id: i64,
        id: i64,
        patch: UpdateEpisode,
    ) -> Result<Episode, EpisodeServiceError> {
        let mut episode = self.get(tenant_id, id).await?;
        if let Some(title) = patch.title {
            let title = title.trim();
            if title.is_empty() {
                return Err(EpisodeServiceError::Validation(
                    "title must not be blank".to_string(),
                ));
            }
            episode.title = title.to_string();
        }
        if let Some(synopsis) = patch.synopsis {
            episode.synopsis = Some(synopsis);
        }
        episode.updated_at = chrono::Utc::now();
        self.repository
            .update(&episode)
            .await
            .map_err(EpisodeServiceError::Storage)?;
        Ok(episode)
    }

    async fn delete(&self, tenant_id: i64, id: i64) -> Result<(), EpisodeServiceError> {
        let deleted = self
            .repository
            .delete(tenant_id, id)
            .await
            .map_err(EpisodeServiceError::Storage)?;
        if !deleted {
            return Err(EpisodeServiceError::NotFound);
        }
        Ok(())
    }

    async fn publish(&self, tenant_id: i64, id: i64) -> Result<Episode, EpisodeServiceError> {
        let mut episode = self.get(tenant_id, id).await?;
        episode
            .publish()
            .map_err(|EpisodeError::InvalidTransition { from, to }| {
                tracing::warn!(from, to, "invalid episode transition");
                EpisodeServiceError::Conflict(format!(
                    "episode {id} cannot transition from {from} to {to}"
                ))
            })?;
        self.repository
            .update(&episode)
            .await
            .map_err(EpisodeServiceError::Storage)?;
        Ok(episode)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::EpisodeStatus;
    use sdkwork_database_id::SnowflakeIdGenerator;
    use std::sync::Mutex;

    fn test_ids() -> Arc<SnowflakeIdGenerator> {
        Arc::new(SnowflakeIdGenerator::new(1).expect("dev snowflake generator"))
    }

    #[derive(Default)]
    struct InMemoryStore {
        episodes: Mutex<Vec<Episode>>,
    }

    #[async_trait]
    impl EpisodeRepository for InMemoryStore {
        async fn insert(&self, episode: &Episode) -> Result<(), RepositoryError> {
            self.episodes.lock().unwrap().push(episode.clone());
            Ok(())
        }

        async fn find_by_id(
            &self,
            tenant_id: i64,
            id: i64,
        ) -> Result<Option<Episode>, RepositoryError> {
            Ok(self
                .episodes
                .lock()
                .unwrap()
                .iter()
                .find(|e| e.tenant_id == tenant_id && e.id == id)
                .cloned())
        }

        async fn list(
            &self,
            tenant_id: i64,
            cursor: Option<i64>,
            limit: i64,
        ) -> Result<Vec<Episode>, RepositoryError> {
            let episodes = self.episodes.lock().unwrap();
            let mut items: Vec<Episode> = episodes
                .iter()
                .filter(|e| e.tenant_id == tenant_id)
                .filter(|e| cursor.is_none_or(|c| e.id > c))
                .cloned()
                .collect();
            items.sort_by_key(|e| e.id);
            items.truncate(limit as usize);
            Ok(items)
        }

        async fn update(&self, episode: &Episode) -> Result<(), RepositoryError> {
            let mut episodes = self.episodes.lock().unwrap();
            if let Some(slot) = episodes.iter_mut().find(|e| e.id == episode.id) {
                *slot = episode.clone();
            }
            Ok(())
        }

        async fn delete(&self, tenant_id: i64, id: i64) -> Result<bool, RepositoryError> {
            let mut episodes = self.episodes.lock().unwrap();
            let before = episodes.len();
            episodes.retain(|e| !(e.tenant_id == tenant_id && e.id == id));
            Ok(episodes.len() < before)
        }
    }

    fn service() -> DefaultEpisodeService {
        DefaultEpisodeService::new(Arc::new(InMemoryStore::default()), test_ids())
    }

    const TENANT: i64 = 100001;
    const USER: i64 = 100002;
    const OTHER_TENANT: i64 = 200001;

    #[tokio::test]
    async fn create_then_publish_transition() {
        let service = service();
        let created = service
            .create(
                TENANT,
                USER,
                CreateEpisode::new("第一集", Some("开场".into())),
            )
            .await
            .expect("create must succeed");
        assert_eq!(created.status, EpisodeStatus::Draft);
        assert!(created.id > 0, "snowflake id must be positive");

        let published = service
            .publish(TENANT, created.id)
            .await
            .expect("draft must publish");
        assert_eq!(published.status, EpisodeStatus::Published);

        let err = service
            .publish(TENANT, created.id)
            .await
            .expect_err("published cannot re-publish");
        assert!(matches!(err, EpisodeServiceError::Conflict(_)));
    }

    #[tokio::test]
    async fn list_respects_limit_and_reports_cursor() {
        let service = service();
        for i in 0..5 {
            service
                .create(TENANT, USER, CreateEpisode::new(format!("第{i}集"), None))
                .await
                .expect("create must succeed");
        }
        let page = service
            .list(TENANT, None, Some(3))
            .await
            .expect("list must succeed");
        assert_eq!(page.items.len(), 3);
        assert!(page.has_more);
        assert!(page.next_cursor.is_some());

        let next = service
            .list(TENANT, page.next_cursor, Some(3))
            .await
            .expect("list must succeed");
        assert_eq!(next.items.len(), 2);
        assert!(!next.has_more);
    }

    #[tokio::test]
    async fn tenants_are_isolated() {
        let service = service();
        let created = service
            .create(TENANT, USER, CreateEpisode::new("私有剧集", None))
            .await
            .expect("create must succeed");

        assert!(matches!(
            service.get(OTHER_TENANT, created.id).await,
            Err(EpisodeServiceError::NotFound)
        ));
        let other_tenant_page = service
            .list(OTHER_TENANT, None, None)
            .await
            .expect("list must succeed");
        assert!(other_tenant_page.items.is_empty());
    }

    #[tokio::test]
    async fn invalid_cursor_is_a_validation_error() {
        let service = service();
        let err = service
            .list(TENANT, Some("not-a-cursor".to_string()), None)
            .await
            .expect_err("invalid cursor must fail");
        assert!(matches!(err, EpisodeServiceError::Validation(_)));
    }

    #[tokio::test]
    async fn blank_title_is_rejected() {
        let service = service();
        let err = service
            .create(TENANT, USER, CreateEpisode::new("   ", None))
            .await
            .expect_err("blank title must fail");
        assert!(matches!(err, EpisodeServiceError::Validation(_)));
    }
}
