//! Route path ownership for the drama app-api surface.
//!
//! Authority: `../sdkwork-specs/WEB_BACKEND_SPEC.md` §3. Health paths
//! (`/app/v3/api/system/health|ready`) are reserved for the standard health
//! route owner and are mounted by the assembly, never by capability code.

/// App API prefix owned by the standard runtime.
pub const APP_API_PREFIX: &str = "/app/v3/api";

/// Standard health/readiness endpoints (standard-owner mounted).
pub const SYSTEM_HEALTH: &str = "/app/v3/api/system/health";
pub const SYSTEM_READY: &str = "/app/v3/api/system/ready";

/// Episode operations.
pub const EPISODES: &str = "/app/v3/api/episodes";
pub const EPISODE_ID: &str = "/app/v3/api/episodes/{episodeId}";
pub const EPISODE_PUBLISH: &str = "/app/v3/api/episodes/{episodeId}/publish";
pub const EPISODE_ASSETS: &str = "/app/v3/api/episodes/{episodeId}/assets";
