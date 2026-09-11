//! Process health assembly for the drama application.
//!
//! Per `../sdkwork-specs/WEB_BACKEND_SPEC.md`, this module assembles
//! `sdkwork_web_bootstrap::ReadinessCheck` implementations instead of
//! defining local probe handlers; the framework `service_router` and the
//! standard-owner `/app/v3/api/system/health|ready` routes mount them.
//! Probe responses follow the `sdkwork-v3` wire protocol: success bodies use
//! the `SdkWorkApiResponse` envelope, failures use problem+json
//! (`API_SPEC.md` §4.5, §15).

use std::sync::Arc;

use axum::Json;
use axum::extract::State;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use sdkwork_utils_rust::{
    SDKWORK_TRACE_ID_HEADER, SdkWorkApiResponse, SdkWorkProblemDetail, SdkWorkResultCode,
};
use sdkwork_web_bootstrap::{ReadinessCheck, ReadinessFuture};
use sdkwork_web_core::WebRequestContext;
use sqlx::PgPool;

/// Readiness for the drama process: the application Postgres pool accepts
/// connections.
pub fn drama_readiness(pool: PgPool) -> Arc<dyn ReadinessCheck> {
    Arc::new(PgPoolReadiness::new(pool))
}

fn respond_envelope<T: serde::Serialize>(status: StatusCode, data: T, trace_id: &str) -> Response {
    let mut response = (
        status,
        Json(SdkWorkApiResponse::success(data, trace_id.to_string())),
    )
        .into_response();
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(SDKWORK_TRACE_ID_HEADER, value);
    }
    response
}

/// Standard-owner liveness probe (`/app/v3/api/system/health`).
pub async fn health_handler(context: WebRequestContext) -> Response {
    let trace_id = context
        .trace_id
        .clone()
        .unwrap_or_else(sdkwork_utils_rust::uuid);
    respond_envelope(
        StatusCode::OK,
        serde_json::json!({ "status": "ok" }),
        &trace_id,
    )
}

/// Standard-owner readiness probe (`/app/v3/api/system/ready`). Delegates to
/// the assembled readiness check injected by the assembly; not-ready yields a
/// 503 problem+json response (`ServiceUnavailable` / 50301).
pub async fn system_ready_handler(
    State(state): State<ReadinessState>,
    context: WebRequestContext,
) -> Response {
    let trace_id = context
        .trace_id
        .clone()
        .unwrap_or_else(sdkwork_utils_rust::uuid);
    let status = match state.0.check().await {
        Ok(()) => {
            return respond_envelope(
                StatusCode::OK,
                serde_json::json!({ "status": "ready" }),
                &trace_id,
            );
        }
        Err(detail) => detail,
    };
    let problem =
        SdkWorkProblemDetail::platform(SdkWorkResultCode::ServiceUnavailable, status, trace_id);
    let code = StatusCode::from_u16(problem.status).unwrap_or(StatusCode::SERVICE_UNAVAILABLE);
    (
        code,
        [(header::CONTENT_TYPE, "application/problem+json")],
        Json(problem),
    )
        .into_response()
}

/// Readiness check carried as router state for the standard-ready probe.
#[derive(Clone)]
pub struct ReadinessState(Arc<dyn ReadinessCheck>);

impl ReadinessState {
    pub fn new(check: Arc<dyn ReadinessCheck>) -> Self {
        Self(check)
    }
}

/// Postgres pool readiness check assembled for this process (same contract
/// as `sdkwork_web_bootstrap::PgPoolReadinessCheck`).
struct PgPoolReadiness {
    pool: PgPool,
}

impl PgPoolReadiness {
    fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl ReadinessCheck for PgPoolReadiness {
    fn check(&self) -> ReadinessFuture<'_> {
        let pool = self.pool.clone();
        Box::pin(async move {
            sqlx::query("SELECT 1")
                .execute(&pool)
                .await
                .map(|_| ())
                .map_err(|err| format!("postgres readiness probe failed: {err}"))
        })
    }
}
