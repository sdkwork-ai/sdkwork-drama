//! Problem+json error mapping for the drama app-api surface.
//!
//! Authority: `../sdkwork-specs/API_SPEC.md` §15.3 — failures are RFC 9457
//! `application/problem+json` bodies carrying the numeric platform result
//! code and the server-owned trace id. Handlers never return bare status
//! codes.

use axum::Json;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use sdkwork_drama_episode_service::EpisodeServiceError;
use sdkwork_drama_media_service::MediaServiceError;
use sdkwork_utils_rust::{SDKWORK_TRACE_ID_HEADER, SdkWorkProblemDetail, SdkWorkResultCode};

/// Transport error carrying the platform result code, a safe detail message,
/// and the request trace id.
#[derive(Debug)]
pub struct DramaApiError {
    code: SdkWorkResultCode,
    detail: String,
    trace_id: Option<String>,
}

impl DramaApiError {
    pub fn new(code: SdkWorkResultCode, detail: impl Into<String>) -> Self {
        Self {
            code,
            detail: detail.into(),
            trace_id: None,
        }
    }

    /// Attach the request trace id so the problem body echoes it.
    pub fn with_trace(mut self, trace_id: impl Into<String>) -> Self {
        self.trace_id = Some(trace_id.into());
        self
    }
}

impl From<EpisodeServiceError> for DramaApiError {
    fn from(value: EpisodeServiceError) -> Self {
        match &value {
            EpisodeServiceError::NotFound => {
                Self::new(SdkWorkResultCode::NotFound, value.to_string())
            }
            EpisodeServiceError::Validation(_) => {
                Self::new(SdkWorkResultCode::ValidationError, value.to_string())
            }
            EpisodeServiceError::Conflict(_) => {
                Self::new(SdkWorkResultCode::Conflict, value.to_string())
            }
            // Storage failures are logged at the adapter; the wire detail is
            // deliberately generic to avoid leaking infrastructure internals.
            EpisodeServiceError::Storage(err) => {
                tracing::error!(%err, "episode storage failure");
                Self::new(SdkWorkResultCode::InternalError, "internal server error")
            }
        }
    }
}

impl From<MediaServiceError> for DramaApiError {
    fn from(value: MediaServiceError) -> Self {
        match &value {
            MediaServiceError::EpisodeNotFound | MediaServiceError::NotFound => {
                Self::new(SdkWorkResultCode::NotFound, value.to_string())
            }
            MediaServiceError::Validation(_) => {
                Self::new(SdkWorkResultCode::ValidationError, value.to_string())
            }
            MediaServiceError::Storage(err) => {
                tracing::error!(%err, "media storage failure");
                Self::new(SdkWorkResultCode::InternalError, "internal server error")
            }
        }
    }
}

impl IntoResponse for DramaApiError {
    fn into_response(self) -> Response {
        let trace_id = self.trace_id.unwrap_or_else(sdkwork_utils_rust::uuid);
        let problem = SdkWorkProblemDetail::platform(self.code, self.detail, trace_id.clone());
        let status =
            StatusCode::from_u16(problem.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        let mut response = (
            status,
            [(header::CONTENT_TYPE, "application/problem+json")],
            Json(problem),
        )
            .into_response();
        if let Ok(value) = HeaderValue::from_str(&trace_id) {
            response
                .headers_mut()
                .insert(SDKWORK_TRACE_ID_HEADER, value);
        }
        response
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use sdkwork_utils_rust::SdkWorkResultCode;

    #[tokio::test]
    async fn not_found_maps_to_problem_json_with_numeric_code() {
        let response = DramaApiError::new(SdkWorkResultCode::NotFound, "missing")
            .with_trace("trace-1")
            .into_response();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        assert_eq!(
            response
                .headers()
                .get(sdkwork_utils_rust::SDKWORK_TRACE_ID_HEADER)
                .and_then(|value| value.to_str().ok()),
            Some("trace-1")
        );
        let body = to_bytes(response.into_body(), 64 * 1024).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["code"], serde_json::json!(40401));
        assert_eq!(json["traceId"], serde_json::json!("trace-1"));
        assert_eq!(json["status"], serde_json::json!(404));
        assert!(
            json["type"]
                .as_str()
                .is_some_and(|t| t.ends_with("/problems/40401")),
            "problem type follows the platform result-code URI"
        );
        // `instance` correlation is enriched downstream by the web-framework
        // problem-correlation layer; the handler body itself omits it.
    }

    #[tokio::test]
    async fn internal_errors_do_not_leak_storage_details() {
        let response = DramaApiError::from(EpisodeServiceError::Storage(
            sdkwork_drama_episode_service::RepositoryError::Unavailable("pg down".into()),
        ))
        .with_trace("trace-2")
        .into_response();
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let body = to_bytes(response.into_body(), 64 * 1024).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        // The platform problem type sanitizes InternalError details itself.
        assert_eq!(
            json["detail"],
            serde_json::json!("An internal error occurred")
        );
        assert_ne!(
            json["detail"],
            serde_json::json!("pg down"),
            "storage details must not leak"
        );
    }
}
