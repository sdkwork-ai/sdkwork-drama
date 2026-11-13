# IAM & Session

- Component: `iam`
- Repository: `sdkwork-iam`
- Category: foundation
- SDK family: `sdkwork-iam-app-sdk`
- Permission module: `iam-kernel`

Login, session, current user, tenant/organization context, token lifecycle, and account security.

## Architecture Availability

| Architecture | Supported | Mode | Language | Package | Note |
| --- | --- | --- | --- | --- | --- |
| pc | yes | linked | typescript | @sdkwork/iam-app-sdk |  |
| h5 | yes | linked | typescript | @sdkwork/iam-app-sdk |  |

## Configuration

```json
{
  "loginMode": "embedded",
  "sessionPersistence": "secure-storage",
  "refreshSession": true,
  "socialLogin": {
    "enabledProviders": [
      "apple",
      "google",
      "meta",
      "github",
      "x",
      "wechat"
    ],
    "providerLabels": {
      "apple": "Apple",
      "google": "Google",
      "meta": "Meta",
      "github": "GitHub",
      "x": "X",
      "wechat": "WeChat"
    },
    "redirectUri": "sdkwork://oauth/callback"
  }
}
```

## Permissions

- No explicit permission scope selected. Inherit the component module catalog.

## Integration Rules

- Consume the generated app SDK package for the architecture language.
- Never copy sdkwork-iam routes, DTOs, or generated transport into this application.
- Keep credentials in the global token manager / host adapter, never in component config.
- Change component settings through `config/components/iam.json`, not by editing generated code.

See `../../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md`.
