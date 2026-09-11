//! Domain model for drama episodes (L3 domain).
//!
//! Pure domain types: no HTTP types, no database row types, no framework
//! dependencies. Route-layer DTOs and repository rows convert at their own
//! layer boundaries. Identity follows `SUBJECT_ID_SPEC.md`: the runtime
//! entity id is a positive snowflake int64 (rendered as a string in HTTP
//! JSON), and every episode is scoped by `tenant_id`/`user_id` subjects
//! taken from validated dual-token claims — never from client input.

use chrono::{DateTime, Utc};

/// Lifecycle status of an episode.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EpisodeStatus {
    Draft,
    Published,
    Retired,
}

impl EpisodeStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Draft => "draft",
            Self::Published => "published",
            Self::Retired => "retired",
        }
    }
}

/// An episode of a short-drama series, owned by a tenant subject.
#[derive(Debug, Clone)]
pub struct Episode {
    pub id: i64,
    pub tenant_id: i64,
    pub user_id: i64,
    pub title: String,
    pub synopsis: Option<String>,
    pub status: EpisodeStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Episode {
    /// Create a new draft episode under the authenticated subject.
    pub fn new_draft(
        id: i64,
        tenant_id: i64,
        user_id: i64,
        title: impl Into<String>,
        synopsis: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id,
            tenant_id,
            user_id,
            title: title.into(),
            synopsis,
            status: EpisodeStatus::Draft,
            created_at: now,
            updated_at: now,
        }
    }

    /// Domain rule: only draft episodes can transition to published.
    pub fn publish(&mut self) -> Result<(), EpisodeError> {
        match self.status {
            EpisodeStatus::Draft => {
                self.status = EpisodeStatus::Published;
                self.updated_at = Utc::now();
                Ok(())
            }
            _ => Err(EpisodeError::InvalidTransition {
                from: self.status.as_str(),
                to: "published",
            }),
        }
    }
}

/// Domain errors, independent of transport and storage.
#[derive(Debug, thiserror::Error)]
pub enum EpisodeError {
    #[error("invalid status transition from {from} to {to}")]
    InvalidTransition {
        from: &'static str,
        to: &'static str,
    },
}
