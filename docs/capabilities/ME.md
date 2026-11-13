# My Account Capability

Standard application capability: **Me / My account**.

Machine contract: `specs/capabilities/catalog.json` (`id: "me"`).

## Purpose

Give every SDKWork application one predictable account surface for identity,
session, security, and preferences. The capability is IAM-backed; it is not a
product-specific profile page.

## IAM Contract

| Concern | IAM surface |
| --- | --- |
| Password login | `auth.sessions.create({ grantType: "password" })` |
| Refresh | `auth.sessions.refresh({ refreshToken })` |
| Current session | `auth.sessions.current.retrieve()` |
| Revoke session | `auth.sessions.current.delete()` |
| Organization selection | `auth.sessions.organizationSelection.create()` |
| Login context selection | `auth.sessions.loginContextSelection.create()` |
| Current profile | `iam.users.current.retrieve()` |
| Password | `iam.users.current.password.update()` |
| Email binding | `iam.users.current.emailBindings` |
| Phone binding | `iam.users.current.phoneBindings` |
| Persona | `iam.users.current.persona.retrieve()` |

The web projection is generated when the `iam` component is linked:

- `src/account/iam-account.ts` — password login, refresh, organization/login-context
  selection, session/profile read, sign-out, token persistence.
- `src/account/account-store.ts` — cross-tab account snapshot propagation via
  `BroadcastChannel` and the storage event.
- `src/account/use-iam-account.ts` — runtime hook that configures the service from
  `VITE_SDKWORK_API_BASE_URL`, loads the account, and exposes sign-in state.

It consumes `@sdkwork/iam-app-sdk` only; it never builds raw HTTP calls or manual
auth headers.

## States

1. **Authenticated** — session and profile are available.
2. **Anonymous** — no session; the client shows the IAM sign-in form.
3. **Selection required** — IAM returns organizations; the client asks the user
   to choose one before loading the account.
4. **Unavailable** — IAM is not selected or the runtime is not configured.

The scaffold renders the **Unavailable** state by default because a generated
repository has no runtime endpoint or credentials yet. The sign-in form is
disabled until `VITE_SDKWORK_API_BASE_URL` is configured. Do not fake a signed-in
user.

## Social Sign-In

Open-platform sign-in is a projection of the same IAM account capability.
Provider selection, backend authority, and the Flutter adapter contract live in
`docs/capabilities/SOCIAL_LOGIN.md` and
`specs/capabilities/social-login.contract.json`. The account page renders only
the intersection of the IAM provider discovery and the local allowlist.

## Required Layout

- Identity block: avatar/initials, display name, account status.
- Facts: application, IAM package, tenant, session source.
- Capability rows: Profile, Session, Security, Preferences.
- No card borders, shadows, or gradients; use the tech-blue tokens.

## Surface Projections

| Surface | Navigation | Projection |
| --- | --- | --- |
| PC / Pad | Left rail `Me` item | `#me` account panel |
| H5 | Bottom tab `Me` | `#me` account panel |
| Flutter | `NavigationBar` `Me` destination | `_meTab` |
| iOS | `TabView` `Me` tab | `MeTab` |
| Android | `NavigationBar` `Me` item | `MeScreen` |
| HarmonyOS | `Tabs` `Me` tab | `Me()` builder |
| Mini program | Fixed bottom tab `Me` | `activeTab === 'me'` |

## Invariants

- Account state is never invented in the shell; it comes from IAM or is shown as unavailable.
- Login uses the password grant; organization selection is a first-class outcome.
- Sign-out revokes the IAM session before clearing local state.
- Tenant and organization context come from the authenticated session.
- Credentials and tokens stay in the global token manager, never in component configuration.
- Cross-tab snapshot updates never carry tokens; each tab owns its token manager.
