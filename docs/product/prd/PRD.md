# SDKWork Drama — Product Requirements (PRD)

- Status: Draft (initial alignment baseline; 🔒 requires product review before further extension)
- Owner: sdkwork-drama maintainers
- App: `drama` — short-drama (短剧) video creation application
- Standards: platform rules live in `../../../sdkwork-specs/`; requirements
  structure follows `../../../sdkwork-specs/REQUIREMENTS_SPEC.md`; this
  document owns drama product scope only

## 1. Product Summary

SDKWork Drama lets creators author short-drama series: they manage episodes,
attach media assets (cover images, episode videos, audio tracks, subtitles)
to episodes, and publish episodes to an audience-facing feed. The application
is a Rust (`rust-axum`) backend serving the SDKWork app-api surface, with
web/desktop client surfaces consuming the generated `@sdkwork/drama-app-sdk`
SDK.

## 2. Users And Roles

| Actor | Description |
| --- | --- |
| Creator | Authenticated tenant user authoring episodes; owns their tenant's episodes and media |
| Viewer | Audience consumer of published episodes (playback surface, later phase) |
| Platform operator | Operates standalone/cloud deployments; no direct data-plane product role |

Authentication is the SDKWork dual-token protocol (`IAM_SPEC.md`); tenants
and users resolve from validated claims only.

## 3. Capability Scope

### 3.1 Episode Authoring (implemented)

- Create a draft episode (title, synopsis). Titles must be non-blank.
- Retrieve a single episode; list episodes with cursor pagination.
- Update draft metadata; delete episodes.
- Publish: only draft episodes may transition to `published`; other
  transitions are conflicts. Statuses: `draft`, `published`, `retired`.
- All operations are tenant-scoped; cross-tenant access is impossible
  (indistinguishable from not-found).

### 3.2 Media Assets (implemented)

- Attach cover images, episode videos, audio, and subtitles to an episode.
  All file storage flows through SDKWork Drive (embedded uploader-service
  integration); the application never talks to storage providers directly.
- Proxied uploads carry file bytes as canonical base64 JSON with a decoded
  cap of 64 MiB per asset — sized for covers, audio, subtitles, and short
  clips.
- Asset records persist the stable `drive://` coordinates for later
  playback/delivery integration. Deleting an episode leaves the drive nodes
  in place; drive retention and maintenance pipelines govern post-episode
  storage lifecycle (uploads carry `app_id`/`app_resource_id` ownership).
- Large episode videos (beyond the proxy cap) use the drive presigned
  direct-upload flow (client-to-storage), planned on the same Drive session
  APIs.

### 3.3 Publishing And Playback (planned)

- Publication pipeline (review queue, scheduled release) and playback
  delivery (streaming URLs via Drive download tokens) are future scope and
  must be specified here before implementation.

## 4. Non-Functional Requirements

- **API contract**: app-api wire protocol per `API_SPEC.md` — success
  envelope `{code: 0, data, traceId}`, RFC 9457 problem+json failures,
  cursor pagination envelopes.
- **Identity**: snowflake int64 entity ids rendered as JSON strings
  (`SUBJECT_ID_SPEC.md`).
- **Deployment**: standalone single-binary gateway and cloud profile;
  identical API contracts across profiles (`DEPLOYMENT_SPEC.md`).
- **Observability**: structured tracing, `X-SdkWork-Trace-Id` correlation,
  `/healthz` `/readyz` `/livez` `/metrics` process probes plus standard
  `/app/v3/api/system/health|ready` endpoints.

## 5. Out Of Scope

Billing, social features (comments/feeds), transcoding workers, and
recommendations are not part of this application; when they become real
requirements they must be added here first, then to `apis/open-api/` before
route crates.
