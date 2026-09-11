//! `sdkwork-drama-database-host`
//!
//! Unified database bootstrap for the drama application (L4 infrastructure
//! host). Wires the application pool through the `sdkwork-database`
//! framework: environment-driven configuration, lifecycle assets under
//! `database/` (baseline + migrations applied by the lifecycle orchestrator
//! — never by application code), and the platform snowflake id generator
//! for subject-spec-compliant identity.
//!
//! Reference integration: `sdkwork-account-database-host`.

use std::path::PathBuf;
use std::sync::Arc;

use sdkwork_database_config::DatabaseConfig;
use sdkwork_database_id::{SnowflakeIdGenerator, SnowflakeNodeAllocator};
use sdkwork_database_lifecycle::{LifecycleOrchestrator, lifecycle_options_from_env};
use sdkwork_database_spi::{DatabaseAssetProvider, DatabaseManifest, DefaultDatabaseModule};
use sdkwork_database_sqlx::{DatabasePool, create_pool_from_config};

/// Bootstrapped database host: shared pool, lifecycle module, id generator.
pub struct DramaDatabaseHost {
    pool: DatabasePool,
    module: Arc<DefaultDatabaseModule>,
    ids: Arc<SnowflakeIdGenerator>,
}

impl DramaDatabaseHost {
    /// Application pool (PostgreSQL).
    pub fn pool(&self) -> &DatabasePool {
        &self.pool
    }

    /// PostgreSQL pool accessor; drama is a PostgreSQL-authoritative
    /// application, so a missing Postgres pool is a boot configuration bug.
    pub fn pg_pool(&self) -> Result<&sqlx::PgPool, String> {
        self.pool
            .as_postgres()
            .ok_or_else(|| "drama requires a PostgreSQL database pool".to_string())
    }

    /// Database lifecycle module (for composition into host registries).
    pub fn module(&self) -> Arc<DefaultDatabaseModule> {
        self.module.clone()
    }

    /// Platform snowflake id generator (`SUBJECT_ID_SPEC.md`).
    pub fn id_generator(&self) -> Arc<SnowflakeIdGenerator> {
        self.ids.clone()
    }
}

/// Resolve the application root that owns the `database/` lifecycle assets.
/// Standalone installs point `SDKWORK_DRAMA_APP_ROOT` at the deployable
/// root; source builds fall back to the repository root.
pub fn drama_app_root() -> PathBuf {
    std::env::var("SDKWORK_DRAMA_APP_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
}

/// Bootstrap the drama database from standard `SDKWORK_DATABASE_*`
/// environment configuration.
pub async fn bootstrap_drama_database_from_env() -> Result<DramaDatabaseHost, String> {
    let config = DatabaseConfig::from_env("DRAMA").map_err(|err| err.to_string())?;
    let pool = create_pool_from_config(config)
        .await
        .map_err(|err| err.to_string())?;
    bootstrap_drama_database_with_pool(pool).await
}

/// Bootstrap lifecycle assets and identity on an existing pool.
pub async fn bootstrap_drama_database_with_pool(
    pool: DatabasePool,
) -> Result<DramaDatabaseHost, String> {
    let app_root = drama_app_root();
    let module =
        Arc::new(DefaultDatabaseModule::from_app_root(&app_root).map_err(|err| err.to_string())?);
    let manifest =
        DatabaseManifest::from_file(module.manifest_path()).map_err(|err| err.to_string())?;
    let options = lifecycle_options_from_env("DRAMA", &manifest);

    let orchestrator =
        LifecycleOrchestrator::new(pool.clone(), module.clone()).with_applied_by("sdkwork-drama");
    orchestrator.init().await.map_err(|err| err.to_string())?;
    if options.auto_migrate || is_development_environment() {
        orchestrator
            .migrate()
            .await
            .map_err(|err| err.to_string())?;
    }

    let ids = allocate_snowflake_generator().await;
    Ok(DramaDatabaseHost { pool, module, ids })
}

/// Allocate the database-backed snowflake generator; fall back to a local
/// dev generator when the allocator backend is unavailable so local
/// development can still boot (with a loud warning).
async fn allocate_snowflake_generator() -> Arc<SnowflakeIdGenerator> {
    match SnowflakeNodeAllocator::allocate_generator_from_env("sdkwork-drama", "DRAMA").await {
        Ok((generator, _lease)) => Arc::new(generator),
        Err(err) => {
            tracing::warn!(
                %err,
                "snowflake node allocator unavailable; falling back to local dev node 1 \
                 (never acceptable in production topology)"
            );
            Arc::new(SnowflakeIdGenerator::new(1).expect("valid dev snowflake node"))
        }
    }
}

/// Development detection aligned with the IAM adapter dev-fallback triggers.
pub fn is_development_environment() -> bool {
    const DEV_VALUES: &[&str] = &["dev", "development", "test", "testing", "local"];
    ["SDKWORK_ENV", "SDKWORK_ENVIRONMENT"].iter().any(|key| {
        std::env::var(key)
            .ok()
            .is_some_and(|value| DEV_VALUES.contains(&value.to_ascii_lowercase().as_str()))
    })
}
