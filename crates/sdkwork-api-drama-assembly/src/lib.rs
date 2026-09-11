//! API assembly for the drama application (L5 composition root).
//!
//! Composes concrete infrastructure (Postgres pool, Drive storage, snowflake
//! identity) behind service ports, mounts capability route crates, wraps the
//! business router in the IAM web-framework layer with production-hardening
//! stores, and mounts the standard health endpoints. This is the only place
//! allowed to know both the repository adapters and the route crates.
//!
//! Infrastructure endpoints (`/healthz`, `/livez`, `/readyz`, `/metrics`)
//! are mounted through `sdkwork-web-bootstrap::service_router`; the
//! app-api-standard `/app/v3/api/system/health|ready` endpoints are mounted
//! here as the standard health route owner
//! (`../sdkwork-specs/WEB_BACKEND_SPEC.md`).

pub mod health;
pub mod web_bootstrap;

use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::routing::get;
use sdkwork_drama_database_host::DramaDatabaseHost;
use sdkwork_drama_episode_repository_sqlx::PgEpisodeRepository;
use sdkwork_drama_episode_service::{DefaultEpisodeService, EpisodeRepository};
use sdkwork_drama_media_drive::DriveMediaStorage;
use sdkwork_drama_media_repository_sqlx::PgMediaAssetRepository;
use sdkwork_drama_media_service::{DefaultMediaService, MediaAssetRepository, MediaStorage};
use sdkwork_routes_drama_app_api as drama_app_api;

/// Business handler timeout applied by the web-framework pipeline
/// (webserver production convention).
const REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

/// Build the fully composed and protected app-api router.
///
/// Wiring direction: `DramaDatabaseHost` -> repository adapters ->
/// services -> route crate `router()` -> IAM web-framework layer (with
/// idempotency, rate-limit, audit, security-event stores and metrics) ->
/// `service_router` infrastructure. No other crate sees both ends.
pub async fn app_router() -> Result<Router, String> {
    let host = sdkwork_drama_database_host::bootstrap_drama_database_from_env().await?;
    app_router_with_host(&host).await
}

/// Compose the router over a pre-bootstrapped database host (used by tests
/// and embedded hosts).
pub async fn app_router_with_host(host: &DramaDatabaseHost) -> Result<Router, String> {
    let pool = host.pg_pool()?.clone();

    // Drive storage bootstrap: embedded Drive core schema + standalone local
    // provider seed (idempotent). Every drama upload flows through Drive.
    sdkwork_drama_media_drive::bootstrap_drive_storage(&pool)
        .await
        .map_err(|err| err.to_string())?;

    // Web-framework store tables (`web_*`, owned by the sdkwork-web database
    // module). The module root resolves via `SDKWORK_WEB_STORE_APP_ROOT`,
    // falling back to the web-framework checkout next to this repository.
    sdkwork_webstore_database_host::bootstrap_webstore_database(host.pool().clone())
        .await
        .map_err(|err| format!("webstore bootstrap failed: {err}"))?;

    // Episode capability wiring.
    let episode_repository: Arc<dyn EpisodeRepository> =
        Arc::new(PgEpisodeRepository::new(pool.clone()));
    let episode_service: Arc<dyn sdkwork_drama_episode_service::EpisodeService> = Arc::new(
        DefaultEpisodeService::new(episode_repository.clone(), host.id_generator()),
    );

    // Media capability wiring (uploads always through the Drive adapter).
    let media_storage: Arc<dyn MediaStorage> = Arc::new(DriveMediaStorage::new(pool.clone()));
    let media_assets: Arc<dyn MediaAssetRepository> =
        Arc::new(PgMediaAssetRepository::new(pool.clone()));
    let media_service: Arc<dyn sdkwork_drama_media_service::MediaService> =
        Arc::new(DefaultMediaService::new(
            media_storage,
            media_assets,
            episode_repository.clone(),
            host.id_generator(),
        ));

    // Business routes under the standard app API prefix, plus the standard
    // health endpoints owned by this assembly.
    let business = drama_app_api::router(episode_service, media_service);
    let system = Router::new()
        .route("/system/health", get(health::health_handler))
        .route("/system/ready", get(health::system_ready_handler))
        .with_state(health::ReadinessState::new(health::drama_readiness(
            pool.clone(),
        )));
    let composed = Router::new()
        .nest(drama_app_api::mount_path(), business)
        .nest(drama_app_api::mount_path(), system);

    // IAM dual-token context resolution + authorization over the manifest,
    // with production-hardening stores backed by the application Postgres
    // pool (`web_*` tables; same layout as the sdkwork-webserver gateway).
    let metrics = sdkwork_web_core::HttpMetricsRegistry::new();
    let resolver = web_bootstrap::resolve_web_auth_resolver().await;
    let builder = sdkwork_iam_web_adapter::build_web_framework_builder(
        resolver,
        drama_app_api::route_manifest(),
        Vec::new(),
    )
    .idempotency_store(sdkwork_web_store_sqlx::shared_idempotency_store_pg(
        pool.clone(),
    ))
    .rate_limit_store(sdkwork_web_store_sqlx::shared_rate_limit_store_pg(
        pool.clone(),
    ))
    .audit_emitter(sdkwork_web_store_sqlx::shared_audit_emitter_pg(
        pool.clone(),
    ))
    .security_event_emitter(sdkwork_web_store_sqlx::shared_security_event_emitter_pg(
        pool.clone(),
    ))
    .metrics_registry(metrics.clone())
    .request_timeout(REQUEST_TIMEOUT);
    let layer = builder.build().into_layer();
    let protected = sdkwork_web_axum::with_web_request_context(composed, layer);

    // Process infrastructure endpoints through the web framework
    // (`WEB_BACKEND_SPEC.md` forbids locally defined /healthz /livez
    // /readyz /metrics handlers).
    let infra = sdkwork_web_bootstrap::service_router(
        protected,
        sdkwork_web_bootstrap::ServiceRouterConfig::default()
            .with_readiness_check(health::drama_readiness(pool))
            .with_metrics(metrics),
    );
    Ok(infra)
}
