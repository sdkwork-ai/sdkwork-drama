# Appbase Foundation

- Component: `appbase`
- Repository: `sdkwork-appbase`
- Category: foundation
- SDK family: `runtime package`
- Permission module: `appbase`

Application foundation, runtime bootstrap, error recovery, feature registry, shell, and shared base-data primitives.

## Architecture Availability

| Architecture | Supported | Mode | Language | Package | Note |
| --- | --- | --- | --- | --- | --- |
| pc | yes | runtime | — | — |  |
| h5 | yes | runtime | — | — |  |

## Configuration

```json
{
  "errorRecovery": true,
  "theme": "system",
  "featureRegistry": true
}
```

## Permissions

- No explicit permission scope selected. Inherit the component module catalog.

## Integration Rules

- Consume the generated app SDK package for the architecture language.
- Never copy sdkwork-appbase routes, DTOs, or generated transport into this application.
- Keep credentials in the global token manager / host adapter, never in component config.
- Change component settings through `config/components/appbase.json`, not by editing generated code.

See `../../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`.
