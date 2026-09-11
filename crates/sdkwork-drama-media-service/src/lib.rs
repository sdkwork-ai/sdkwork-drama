//! `sdkwork-drama-media-service`
//!
//! Media asset capability for the drama application (L2 use-case + L3 domain
//! and ports). Episodes own media assets (cover images, episode videos,
//! audio, subtitles). Byte storage is abstracted behind the `MediaStorage`
//! port so that business code never talks to a storage provider directly;
//! the concrete adapter (`sdkwork-drama-media-drive`) writes every upload
//! through the SDKWork Drive uploader service.

pub mod domain;
pub mod port;
pub mod service;

pub use domain::{MediaAsset, MediaAssetKind};
pub use port::{
    MediaAssetRepository, MediaStorage, MediaStorageError, StoreMediaCommand, StoredMedia,
    UploadMediaCommand,
};
pub use service::{DefaultMediaService, MAX_UPLOAD_BODY_BYTES, MediaService, MediaServiceError};
