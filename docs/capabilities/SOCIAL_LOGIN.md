# Open Platform Sign-In Capability

Standard application capability: **social / open-platform sign-in**.

Machine contract: `specs/capabilities/social-login.contract.json`.

## Supported Platforms

| Provider | IAM code | Aliases |
| --- | --- | --- |
| Apple | `apple` | — |
| Google | `google` | — |
| Meta | `meta` | `facebook` |
| GitHub | `github` | — |
| X | `x` | `twitter` |
| WeChat | `wechat` | `weixin`, `wechat_open` |

Aliases are resolved at the domain boundary; the UI never contains provider
branches. A new provider is added by a descriptor plus an enabled id.

## Two-Plane Configuration

### Backend authority

`sdkwork-iam` owns:

- provider registry and client ids/secrets;
- callback URLs and token exchange;
- `GET /oauth/providers` discovery;
- `POST /oauth/authorization_urls` authorization URL creation;
- `POST /oauth/callbacks/{providerCode}` callback handling.

Secrets are never sent to a client.

### Frontend projection

The generated app config owns:

- the local allowlist and display order;
- display labels;
- redirect URI;
- the provider descriptors used for rendering.

The UI renders the intersection of IAM discovery and the local allowlist. If
IAM disables a provider, the client cannot force it on.

## Flutter Architecture

```text
SocialLoginPanel
  -> SocialAuthService (interface)
       -> IamSocialAuthService
            -> IAM OAuth discovery + authorization URL
  -> SocialAuthLauncher (interface)
       -> BrowserSocialAuthLauncher (url_launcher)
```

- `social_provider.dart` — provider descriptors and pure merge/resolve logic.
- `social_auth_service.dart` — high-level port; no Flutter UI or HTTP.
- `iam_social_auth_service.dart` — IAM adapter; no provider-specific branches.
- `social_auth_launcher.dart` — external-browser port.
- `social_login_panel.dart` — presentation and interaction state only.

The panel depends on interfaces, not on IAM. A test or a different identity
provider can replace the service and launcher without touching the UI.

## State Rules

1. No IAM endpoint -> panel explains configuration is missing; no fake buttons.
2. Discovery empty -> panel says no provider is enabled by both planes.
3. Authorization URL returned -> open external browser.
4. Callback exchange remains IAM-owned; the app must not accept provider tokens.
5. Failures stay local to the panel and use the warning token.

## Security Invariants

- Client secrets never appear in the Flutter bundle or `config/components`.
- Provider access tokens never enter app storage.
- The `state` value is generated per authorization attempt.
- The redirect URI is configured, not derived from user input.
- Only `https` authorization URLs are allowed by the IAM authority.
