//! Route manifest for the drama app-api surface.
//!
//! Machine-readable inventory of every operation owned by this surface with
//! its standard auth mode (`../sdkwork-specs/API_SPEC.md`): probe endpoints
//! are public; business operations require dual-token. Operation ids use the
//! standard `resource.action` form (action-final per `API_SPEC.md` 15.4).
//! The manifest feeds the IAM web-framework layer (context resolution +
//! authorization) and is kept in sync with `apis/open-api/` (the contract
//! authority).

use sdkwork_web_contract::{HttpMethod, HttpRoute, RateLimitTier};
use sdkwork_web_core::HttpRouteManifest;

use crate::paths;

/// All operations owned by the drama app-api surface.
pub fn route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::from_owned_routes(vec![
        // Standard health/readiness probes (standard-owner mounted, anonymous).
        HttpRoute::public(
            HttpMethod::Get,
            paths::SYSTEM_HEALTH,
            "system",
            "systemHealth.retrieve",
        ),
        HttpRoute::public(
            HttpMethod::Get,
            paths::SYSTEM_READY,
            "system",
            "systemReady.retrieve",
        ),
        // Episode operations (dual-token protected app-api).
        HttpRoute::dual_token(HttpMethod::Get, paths::EPISODES, "episode", "episodes.list")
            .with_rate_limit_tier(RateLimitTier::Search),
        HttpRoute::dual_token(
            HttpMethod::Post,
            paths::EPISODES,
            "episode",
            "episodes.create",
        )
        .with_idempotent(true),
        HttpRoute::dual_token(
            HttpMethod::Get,
            paths::EPISODE_ID,
            "episode",
            "episodes.retrieve",
        ),
        HttpRoute::dual_token(
            HttpMethod::Patch,
            paths::EPISODE_ID,
            "episode",
            "episodes.update",
        )
        .with_idempotent(true),
        HttpRoute::dual_token(
            HttpMethod::Delete,
            paths::EPISODE_ID,
            "episode",
            "episodes.delete",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            paths::EPISODE_PUBLISH,
            "episode",
            "episodes.publish",
        )
        .with_idempotent(true),
        HttpRoute::dual_token(
            HttpMethod::Post,
            paths::EPISODE_ASSETS,
            "episode",
            "episodeAssets.create",
        )
        .with_idempotent(true)
        .with_rate_limit_tier(RateLimitTier::Upload),
        HttpRoute::dual_token(
            HttpMethod::Get,
            paths::EPISODE_ASSETS,
            "episode",
            "episodeAssets.list",
        )
        .with_rate_limit_tier(RateLimitTier::Search),
    ])
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_web_contract::RouteAuth;

    #[test]
    fn manifest_entries_are_unique_by_method_and_path() {
        let manifest = route_manifest();
        let mut keys: Vec<(String, String)> = manifest
            .routes()
            .iter()
            .map(|route| (format!("{:?}", route.method), route.path.to_string()))
            .collect();
        keys.sort();
        let count = keys.len();
        keys.dedup();
        assert_eq!(keys.len(), count, "duplicate method+path in manifest");
        assert!(!manifest.routes().is_empty());
    }

    #[test]
    fn business_operations_require_dual_token() {
        for route in route_manifest().routes() {
            if route.path.starts_with(paths::APP_API_PREFIX) && route.path.contains("/episodes") {
                assert!(
                    matches!(route.auth, RouteAuth::DualToken),
                    "business route {:?} {} must be dual-token",
                    route.method,
                    route.path
                );
            }
        }
    }

    #[test]
    fn probes_are_public() {
        for route in route_manifest().routes() {
            if route.path.starts_with("/app/v3/api/system/") {
                assert!(matches!(route.auth, RouteAuth::Public));
            }
        }
    }
}
