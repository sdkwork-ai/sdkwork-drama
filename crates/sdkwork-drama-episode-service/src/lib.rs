//! `sdkwork-drama-episode-service`
//!
//! Service crate for the drama episode capability (L2 use-case + L3 domain
//! and ports). Depends on neither HTTP frameworks nor concrete storage
//! adapters — those live in route crates and repository crates respectively.

pub mod domain;
pub mod port;
pub mod service;

pub use domain::{Episode, EpisodeError, EpisodeStatus};
pub use port::{CreateEpisode, EpisodeRepository, RepositoryError, UpdateEpisode};
pub use service::{
    DEFAULT_LIST_LIMIT, DefaultEpisodeService, EpisodePage, EpisodeService, EpisodeServiceError,
    MAX_LIST_LIMIT,
};
