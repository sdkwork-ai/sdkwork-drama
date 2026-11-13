# Capture configuration

`capture.config.json` is the machine contract for screenshot and content media
capture. It follows `schemas/sdkwork.app-assets.capture.schema.v1.json` and
`APP_ASSETS_SPEC.md` section 6.

Rules:

- Every shipped UI surface has one surface entry.
- The capture command is non-interactive and fails when a surface cannot be captured.
- Raw output stays out of `assets/media/`.
- Captures record tool, version, application version, commit, locale, and display type.
