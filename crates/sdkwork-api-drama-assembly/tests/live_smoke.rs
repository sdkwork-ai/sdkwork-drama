//! Live smoke test for the fully composed drama app-api router.
//!
//! Exercises the complete stack — database bootstrap (drama module, drive
//! module, web store), IAM dual-token context resolution (development
//! fallback), the web-framework pipeline, envelope/problem+json shapes, the
//! episode lifecycle, and a drive-backed media upload — against a real
//! PostgreSQL instance.
//!
//! Gated behind `SDKWORK_DRAMA_LIVE_SMOKE=1` and `SDKWORK_DATABASE_URL`
//! (development instance); the test skips itself when the gate is absent so
//! `cargo test --workspace` stays hermetic.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use sdkwork_web_core::jwt_fixtures::{access_token_jwt, auth_token_jwt};
use tower::ServiceExt;

const TENANT_A: &str = "100001";
const USER_A: &str = "100002";
const TENANT_B: &str = "200001";
const USER_B: &str = "200002";

fn smoke_enabled() -> bool {
    std::env::var("SDKWORK_DRAMA_LIVE_SMOKE")
        .is_ok_and(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes"))
}

fn dual_token_headers(tenant: &str, user: &str) -> Vec<(&'static str, String)> {
    vec![
        (
            "authorization",
            format!(
                "Bearer {}",
                auth_token_jwt(tenant, user, "session-1", "sdkwork-drama")
            ),
        ),
        (
            "access-token",
            access_token_jwt(tenant, user, "session-1", "sdkwork-drama"),
        ),
    ]
}

async fn serve_request(
    router: &axum::Router,
    method: &str,
    uri: &str,
    headers: Vec<(&'static str, String)>,
    body: Option<String>,
) -> (StatusCode, serde_json::Value, axum::http::HeaderMap) {
    let mut builder = Request::builder().method(method).uri(uri);
    for (name, value) in headers {
        builder = builder.header(name, value);
    }
    let request = builder
        .header("content-type", "application/json")
        .body(Body::from(body.unwrap_or_default()))
        .expect("valid request");
    let response = router
        .clone()
        .oneshot(request)
        .await
        .expect("router must respond");
    let status = response.status();
    let headers = response.headers().clone();
    let bytes = axum::body::to_bytes(response.into_body(), 96 * 1024 * 1024)
        .await
        .expect("readable body");
    let json = if bytes.is_empty() {
        serde_json::Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Null)
    };
    (status, json, headers)
}

#[tokio::test]
async fn live_smoke_full_episode_and_media_flow() {
    if !smoke_enabled() {
        println!("live smoke skipped: set SDKWORK_DRAMA_LIVE_SMOKE=1 with SDKWORK_DATABASE_URL");
        return;
    }
    // SAFETY: this gated smoke test runs before any other thread is spawned
    // by the test process, so process-environment mutation cannot race.
    unsafe {
        std::env::set_var("SDKWORK_ENV", "development");
        std::env::set_var("SDKWORK_ENVIRONMENT", "development");
        std::env::set_var("SDKWORK_DATABASE_AUTO_MIGRATE", "1");
    }

    let host = sdkwork_drama_database_host::bootstrap_drama_database_from_env()
        .await
        .expect("database bootstrap must succeed");
    let router = sdkwork_api_drama_assembly::app_router_with_host(&host)
        .await
        .expect("router composition must succeed");

    // 1. Standard-owner health probe: v3 envelope, trace header.
    let (status, body, headers) =
        serve_request(&router, "GET", "/app/v3/api/system/health", vec![], None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["code"], 0);
    assert_eq!(body["data"]["status"], "ok");
    assert!(!body["traceId"].as_str().unwrap_or_default().is_empty());
    assert!(headers.contains_key("x-sdkwork-trace-id"));

    // 2. Infrastructure probes mounted through the web framework.
    let (status, _, _) = serve_request(&router, "GET", "/healthz", vec![], None).await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = serve_request(&router, "GET", "/readyz", vec![], None).await;
    assert_eq!(status, StatusCode::OK);

    // 3. Protected business route without credentials: 401 problem+json.
    let (status, body, _) =
        serve_request(&router, "GET", "/app/v3/api/episodes", vec![], None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], 40101);

    // 4. Create a draft episode under tenant A (201 + data.item).
    let (status, body, _) = serve_request(
        &router,
        "POST",
        "/app/v3/api/episodes",
        dual_token_headers(TENANT_A, USER_A),
        Some(r#"{"title":"第一集","synopsis":"冒烟测试"}"#.to_string()),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "create body: {body}");
    assert_eq!(body["code"], 0);
    assert_eq!(body["data"]["item"]["title"], "第一集");
    let episode_id = body["data"]["item"]["id"]
        .as_str()
        .expect("snowflake id serializes as string")
        .to_string();
    assert!(!episode_id.is_empty());

    // 5. Cross-tenant read is indistinguishable from not-found (404 problem).
    let (status, body, _) = serve_request(
        &router,
        "GET",
        &format!("/app/v3/api/episodes/{episode_id}"),
        dual_token_headers(TENANT_B, USER_B),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body["code"], 40401);

    // 6. Cursor listing page envelope.
    let (status, body, _) = serve_request(
        &router,
        "GET",
        "/app/v3/api/episodes?page_size=2",
        dual_token_headers(TENANT_A, USER_A),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["data"]["pageInfo"]["mode"], "cursor");
    assert!(
        !body["data"]["items"]
            .as_array()
            .expect("items")
            .is_empty()
    );

    // 7. Update then publish (idempotent-keyed command).
    let (status, body, _) = serve_request(
        &router,
        "PATCH",
        &format!("/app/v3/api/episodes/{episode_id}"),
        dual_token_headers(TENANT_A, USER_A),
        Some(r#"{"synopsis":"更新后的简介"}"#.to_string()),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["data"]["synopsis"], "更新后的简介");

    let (status, body, _) = serve_request(
        &router,
        "POST",
        &format!("/app/v3/api/episodes/{episode_id}/publish"),
        dual_token_headers(TENANT_A, USER_A),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["data"]["status"], "published");

    // Re-publishing is a conflict (409 problem+json).
    let (status, body, _) = serve_request(
        &router,
        "POST",
        &format!("/app/v3/api/episodes/{episode_id}/publish"),
        dual_token_headers(TENANT_A, USER_A),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["code"], 40901);

    // 8. Media upload through drive: base64 JSON proxy upload.
    let upload_body = serde_json::json!({
        "kind": "cover",
        "fileName": "cover.txt",
        "contentType": "text/plain",
        "content": "aGVsbG8gc21va2U=", // "hello smoke"
        "encoding": "base64",
    });
    let (status, body, _) = serve_request(
        &router,
        "POST",
        &format!("/app/v3/api/episodes/{episode_id}/assets"),
        dual_token_headers(TENANT_A, USER_A),
        Some(upload_body.to_string()),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "upload body: {body}");
    let drive_uri = body["data"]["item"]["driveUri"]
        .as_str()
        .expect("drive uri recorded")
        .to_string();
    assert!(
        drive_uri.starts_with("drive://spaces/"),
        "drive uri: {drive_uri}"
    );

    // 9. Invalid base64 is a validation problem, never a 500.
    let bad_upload = serde_json::json!({
        "kind": "cover",
        "fileName": "bad.txt",
        "contentType": "text/plain",
        "content": "!!!not-base64!!!",
        "encoding": "base64",
    });
    let (status, body, _) = serve_request(
        &router,
        "POST",
        &format!("/app/v3/api/episodes/{episode_id}/assets"),
        dual_token_headers(TENANT_A, USER_A),
        Some(bad_upload.to_string()),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], 40001);

    // 10. Delete the episode (204, trace header only).
    let (status, body, headers) = serve_request(
        &router,
        "DELETE",
        &format!("/app/v3/api/episodes/{episode_id}"),
        dual_token_headers(TENANT_A, USER_A),
        None,
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(body, serde_json::Value::Null);
    assert!(headers.contains_key("x-sdkwork-trace-id"));
}
