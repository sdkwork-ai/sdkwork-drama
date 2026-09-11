//! Standalone gateway/process host for the drama application
//! (`sdkwork-api-<application-code>-standalone-gateway` per
//! `../sdkwork-specs/WEB_BACKEND_SPEC.md`).
//!
//! Composes the API assembly and serves the public application ingress with
//! graceful shutdown. Configuration is environment-driven; source profiles
//! live under `etc/`.

use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    sdkwork_web_bootstrap::init_tracing();

    let router = sdkwork_api_drama_assembly::app_router()
        .await
        .unwrap_or_else(|err| {
            eprintln!("drama assembly bootstrap failed: {err}");
            std::process::exit(1);
        });

    let addr = bind_addr();
    tracing::info!(%addr, "sdkwork-drama standalone gateway listening");
    if let Err(err) = sdkwork_web_bootstrap::serve(router, addr).await {
        eprintln!("drama standalone gateway terminated: {err}");
        std::process::exit(1);
    }
}

/// Bind address from `SDKWORK_DRAMA_HTTP_BIND` (host:port). Defaults to the
/// loopback development address; deployment profiles under `etc/` pin the
/// real value per environment.
fn bind_addr() -> SocketAddr {
    std::env::var("SDKWORK_DRAMA_HTTP_BIND")
        .unwrap_or_else(|_| "127.0.0.1:8090".to_string())
        .parse()
        .unwrap_or_else(|err| {
            eprintln!("invalid SDKWORK_DRAMA_HTTP_BIND: {err}");
            std::process::exit(1);
        })
}
