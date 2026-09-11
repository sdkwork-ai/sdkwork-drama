//! Envelope helpers for the drama app-api surface.
//!
//! Authority: `../sdkwork-specs/API_SPEC.md` §4.5 and §15.1 — success bodies
//! use `SdkWorkApiResponse` (`{code: 0, data, traceId}`) from
//! `sdkwork-utils-rust`, with the `X-SdkWork-Trace-Id` response header.
//! Handlers MUST NOT construct ad-hoc envelope JSON.

use axum::Json;
use axum::http::HeaderValue;
use axum::response::{IntoResponse, Response};
use sdkwork_utils_rust::{
    PageInfo, PageMode, SDKWORK_TRACE_ID_HEADER, SdkWorkApiResponse, SdkWorkPageData,
    SdkWorkResourceData,
};
use sdkwork_web_core::WebRequestContext;

/// Resolve the server-owned trace id for a request. The web-framework
/// response identity generates it; the fallback only guards probes that
/// bypass the framework layer.
pub fn trace_of(context: &WebRequestContext) -> String {
    context
        .trace_id
        .clone()
        .unwrap_or_else(sdkwork_utils_rust::uuid)
}

fn respond<T: serde::Serialize>(
    status: axum::http::StatusCode,
    body: T,
    trace_id: &str,
) -> Response {
    let mut response = (status, Json(body)).into_response();
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(SDKWORK_TRACE_ID_HEADER, value);
    }
    response
}

/// 200 success envelope wrapping a single resource.
pub fn ok_resource<T: serde::Serialize>(data: T, trace_id: String) -> Response {
    respond(
        axum::http::StatusCode::OK,
        SdkWorkApiResponse::success(data, trace_id.clone()),
        &trace_id,
    )
}

/// 201 created envelope wrapping a single resource under `data.item`
/// (`API_SPEC.md` §15.4 create operation contract).
pub fn created_resource<T: serde::Serialize>(item: T, trace_id: String) -> Response {
    let data = SdkWorkResourceData { item };
    respond(
        axum::http::StatusCode::CREATED,
        SdkWorkApiResponse::success(data, trace_id.clone()),
        &trace_id,
    )
}

/// 200 success envelope wrapping a cursor page (`{items, pageInfo}`).
pub fn ok_page<T: serde::Serialize>(
    items: Vec<T>,
    next_cursor: Option<String>,
    has_more: bool,
    page_size: i64,
    trace_id: String,
) -> Response {
    let page_info = PageInfo {
        mode: PageMode::Cursor,
        page: None,
        page_size: Some(page_size as i32),
        total_items: None,
        total_pages: None,
        next_cursor,
        has_more: Some(has_more),
    };
    let data = SdkWorkPageData { items, page_info };
    ok_resource(data, trace_id)
}

/// 204 no-body success; the trace id travels only in the response header
/// (`API_SPEC.md` §15.1).
pub fn no_content(trace_id: &str) -> Response {
    let mut response = axum::http::StatusCode::NO_CONTENT.into_response();
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(SDKWORK_TRACE_ID_HEADER, value);
    }
    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use serde::Serialize;

    #[derive(Serialize)]
    struct Sample {
        value: i32,
    }

    #[tokio::test]
    async fn ok_resource_uses_v3_envelope() {
        let response = ok_resource(Sample { value: 1 }, "trace-ok".to_string());
        assert_eq!(response.status(), axum::http::StatusCode::OK);
        assert_eq!(
            response
                .headers()
                .get(SDKWORK_TRACE_ID_HEADER)
                .and_then(|value| value.to_str().ok()),
            Some("trace-ok")
        );
        let body = to_bytes(response.into_body(), 64 * 1024).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["code"], serde_json::json!(0));
        assert_eq!(json["traceId"], serde_json::json!("trace-ok"));
        assert_eq!(json["data"]["value"], serde_json::json!(1));
        assert!(json.get("message").is_none(), "v3 envelope has no message");
    }

    #[tokio::test]
    async fn created_resource_wraps_item() {
        let response = created_resource(Sample { value: 7 }, "trace-created".to_string());
        assert_eq!(response.status(), axum::http::StatusCode::CREATED);
        let body = to_bytes(response.into_body(), 64 * 1024).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["data"]["item"]["value"], serde_json::json!(7));
    }

    #[tokio::test]
    async fn ok_page_uses_cursor_page_info() {
        let response = ok_page(
            vec![Sample { value: 1 }],
            Some("123".to_string()),
            true,
            20,
            "trace-page".to_string(),
        );
        let body = to_bytes(response.into_body(), 64 * 1024).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["data"]["items"].as_array().unwrap().len(), 1);
        assert_eq!(
            json["data"]["pageInfo"]["mode"],
            serde_json::json!("cursor")
        );
        assert_eq!(
            json["data"]["pageInfo"]["nextCursor"],
            serde_json::json!("123")
        );
        assert_eq!(json["data"]["pageInfo"]["hasMore"], serde_json::json!(true));
    }

    #[tokio::test]
    async fn no_content_has_no_body_but_trace_header() {
        let response = no_content("trace-204");
        assert_eq!(response.status(), axum::http::StatusCode::NO_CONTENT);
        assert_eq!(
            response
                .headers()
                .get(SDKWORK_TRACE_ID_HEADER)
                .and_then(|value| value.to_str().ok()),
            Some("trace-204")
        );
    }
}
