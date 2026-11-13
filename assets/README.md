# sdkwork-drama app assets

Owner: sdkwork-drama maintainers
Standard: `sdkwork-app-assets.v1` (`sdkwork-specs/APP_ASSETS_SPEC.md`)
Catalog: `agent.app.config.json#media`

App type: `APP_REACT`
Delivery surfaces: WEB, H5

## Required media

- `ICON` 1024 x 1024 PNG, no alpha channel
- `COVER` 1920 x 1080, one per locale
- `SCREENSHOT` for every shipped UI surface

## Capture surfaces

- web-primary: WEB / DESKTOP_16_9 / en-US
- h5-primary: H5 / H5_9_16 / en-US

The machine contract is `assets/capture/capture.config.json`. The capture command
must be deterministic, must fail closed when a declared surface cannot be
captured, and must write raw output to `.sdkwork/tmp/assets-capture` (or another
ignored directory). Curated files are committed under `assets/media/`.

## Layout

- `resources/` — runtime or content resources owned by the application or content
- `media/` — catalog and store media; never imported by application source
- `media/store/` — store-specific derivatives
- `capture/` — capture configuration and evidence metadata
- `source/` — optional editable design masters

## Rights and privacy

Record the license or rights basis for every photograph, illustration, font, and
footage used here. Screenshots and covers must not contain personal data, live
credentials, internal URLs, or customer content. Strip EXIF/GPS metadata before
committing.

## Update procedure

1. Update the source master (design tool or authored content).
2. Run the capture command for changed surfaces.
3. Replace the curated file under `assets/media/` and update the manifest entry
   (`path`, dimensions, format, file size, alpha, capture metadata).
4. Run `node ../sdkwork-specs/tools/check-app-assets-standard.mjs --root .`.
5. Upload through Drive on release; keep `path` as provenance.
