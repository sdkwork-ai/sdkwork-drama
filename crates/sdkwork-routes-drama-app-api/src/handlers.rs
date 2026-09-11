//! HTTP handlers for the drama app-api surface.
//!
//! Handlers are thin adapters: resolve the request context, call the service
//! ports, and map results into the standard envelope (`API_SPEC.md` §4.5).
//! No business logic here. The tenant/user subjects always come from the
//! validated `WebRequestContext` — never from client input
//! (`SUBJECT_ID_SPEC.md`).

use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::response::Response;
use sdkwork_drama_episode_service::EpisodeService;
use sdkwork_drama_media_service::MediaService;
use sdkwork_utils_rust::SdkWorkResultCode;
use sdkwork_web_core::WebRequestContext;

use crate::dto::{
    CreateEpisodeRequest, CreateMediaAssetRequest, EpisodeResource, ListEpisodesQuery,
    MediaAssetResource, UpdateEpisodeRequest,
};
use crate::error::DramaApiError;
use crate::response::{created_resource, no_content, ok_page, ok_resource, trace_of};

/// Shared handler state: the service ports only — never a concrete repository.
#[derive(Clone)]
pub struct DramaAppState {
    pub episodes: Arc<dyn EpisodeService>,
    pub media: Arc<dyn MediaService>,
}

/// Extract the tenant subject from the validated request context.
fn require_tenant_id(context: &WebRequestContext) -> Result<i64, DramaApiError> {
    let raw = context.require_tenant_id().map_err(|err| {
        DramaApiError::new(SdkWorkResultCode::AuthenticationRequired, err.to_string())
    })?;
    raw.parse::<i64>().map_err(|_| {
        DramaApiError::new(
            SdkWorkResultCode::AuthenticationRequired,
            "tenant subject is not a valid snowflake id",
        )
    })
}

/// Extract the user subject; optional only for anonymous-capable profiles.
fn require_user_id(context: &WebRequestContext) -> Result<i64, DramaApiError> {
    let raw = context.require_principal().map_err(|err| {
        DramaApiError::new(SdkWorkResultCode::AuthenticationRequired, err.to_string())
    })?;
    raw.user_id().parse::<i64>().map_err(|_| {
        DramaApiError::new(
            SdkWorkResultCode::AuthenticationRequired,
            "user subject is not a valid snowflake id",
        )
    })
}

fn require_path_id(raw: &str) -> Result<i64, DramaApiError> {
    raw.parse::<i64>().map_err(|_| {
        DramaApiError::new(
            SdkWorkResultCode::InvalidParameter,
            "path id must be a decimal id",
        )
    })
}

/// GET /app/v3/api/episodes
pub async fn list_episodes(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Query(query): Query<ListEpisodesQuery>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let page = state
        .episodes
        .list(tenant_id, query.cursor, query.page_size)
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    let items: Vec<EpisodeResource> = page.items.into_iter().map(Into::into).collect();
    let page_size = query
        .page_size
        .unwrap_or(sdkwork_drama_episode_service::DEFAULT_LIST_LIMIT);
    Ok(ok_page(
        items,
        page.next_cursor,
        page.has_more,
        page_size,
        trace_id,
    ))
}

/// GET /app/v3/api/episodes/{episodeId}
pub async fn get_episode(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Path(episode_id): Path<String>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let id = require_path_id(&episode_id).map_err(|err| err.with_trace(trace_id.clone()))?;
    let episode = state
        .episodes
        .get(tenant_id, id)
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    Ok(ok_resource(EpisodeResource::from(episode), trace_id))
}

/// POST /app/v3/api/episodes
pub async fn create_episode(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    axum::Json(request): axum::Json<CreateEpisodeRequest>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let user_id = require_user_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let episode = state
        .episodes
        .create(tenant_id, user_id, request.into())
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    Ok(created_resource(EpisodeResource::from(episode), trace_id))
}

/// PATCH /app/v3/api/episodes/{episodeId}
pub async fn update_episode(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Path(episode_id): Path<String>,
    axum::Json(request): axum::Json<UpdateEpisodeRequest>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let id = require_path_id(&episode_id).map_err(|err| err.with_trace(trace_id.clone()))?;
    let episode = state
        .episodes
        .update(tenant_id, id, request.into())
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    Ok(ok_resource(EpisodeResource::from(episode), trace_id))
}

/// DELETE /app/v3/api/episodes/{episodeId}
pub async fn delete_episode(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Path(episode_id): Path<String>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let id = require_path_id(&episode_id).map_err(|err| err.with_trace(trace_id.clone()))?;
    state
        .episodes
        .delete(tenant_id, id)
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    Ok(no_content(&trace_id))
}

/// POST /app/v3/api/episodes/{episodeId}/publish
pub async fn publish_episode(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Path(episode_id): Path<String>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let id = require_path_id(&episode_id).map_err(|err| err.with_trace(trace_id.clone()))?;
    let episode = state
        .episodes
        .publish(tenant_id, id)
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    Ok(ok_resource(EpisodeResource::from(episode), trace_id))
}

/// POST /app/v3/api/episodes/{episodeId}/assets — proxied upload through
/// SDKWork Drive. File bytes travel as canonical base64 JSON (the platform
/// content payload idiom); the decoded cap is enforced by the media service.
pub async fn create_episode_asset(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Path(episode_id): Path<String>,
    axum::Json(request): axum::Json<CreateMediaAssetRequest>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let user_id = require_user_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let id = require_path_id(&episode_id).map_err(|err| err.with_trace(trace_id.clone()))?;

    if request.encoding.as_str() != "base64" {
        return Err(DramaApiError::new(
            SdkWorkResultCode::ValidationError,
            "encoding must be base64",
        )
        .with_trace(trace_id));
    }
    let body = sdkwork_utils_rust::base64_decode(&request.content).ok_or_else(|| {
        DramaApiError::new(
            SdkWorkResultCode::ValidationError,
            "content must be canonical base64",
        )
    })?;

    let kind = sdkwork_drama_media_service::MediaAssetKind::parse(&request.kind)
        .ok_or_else(|| {
            DramaApiError::new(
                SdkWorkResultCode::ValidationError,
                format!("unknown asset kind {}", request.kind),
            )
        })
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    let command = sdkwork_drama_media_service::UploadMediaCommand {
        kind,
        file_name: request.file_name,
        content_type: request.content_type,
        body,
    };

    let asset = state
        .media
        .create_asset(tenant_id, user_id, id, command)
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    Ok(created_resource(MediaAssetResource::from(asset), trace_id))
}

/// GET /app/v3/api/episodes/{episodeId}/assets
pub async fn list_episode_assets(
    State(state): State<DramaAppState>,
    context: WebRequestContext,
    Path(episode_id): Path<String>,
) -> Result<Response, DramaApiError> {
    let trace_id = trace_of(&context);
    let tenant_id = require_tenant_id(&context).map_err(|err| err.with_trace(trace_id.clone()))?;
    let id = require_path_id(&episode_id).map_err(|err| err.with_trace(trace_id.clone()))?;
    let assets = state
        .media
        .list_assets(tenant_id, id)
        .await
        .map_err(DramaApiError::from)
        .map_err(|err| err.with_trace(trace_id.clone()))?;
    let items: Vec<MediaAssetResource> = assets.into_iter().map(Into::into).collect();
    let count = items.len() as i64;
    Ok(ok_page(items, None, false, count, trace_id))
}
