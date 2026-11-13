# Application Runtime Capability

Standard application capability: **runtime bootstrap and failure containment**.

Machine contract: `specs/capabilities/catalog.json` (`id: "runtime"`).

## Purpose

Every browser surface boots through one predictable runtime boundary:

1. Resolve application identity, architecture, profile, environment, and API base URL.
2. Install a top-level React error boundary.
3. Render the shell only through that boundary.

## Files

| File | Responsibility |
| --- | --- |
| `src/appbase/runtime.ts` | Read `VITE_SDKWORK_*` environment and describe the runtime |
| `src/appbase/AppErrorBoundary.tsx` | Contain render failures and offer a reload |
| `src/main.tsx` | Bootstrap: read runtime, mount boundary, render App |
| `src/composition/sdkRuntime.ts` | One shared token manager and SDK client set |

## Invariants

- Runtime values come from Vite environment; no secrets are read or displayed.
- A missing API base URL is a valid state (`api-unconfigured`), not a crash.
- The error boundary never swallows the error silently: it logs the component stack.
- Recovery is a full reload, not an in-place retry that can loop.
- The fallback uses the same tech-blue tokens and has no border or shadow.

## Environment

| Variable | Meaning |
| --- | --- |
| `VITE_SDKWORK_API_BASE_URL` | API gateway base URL |
| `VITE_SDKWORK_DEPLOYMENT_PROFILE` | Deployment profile label |
| `VITE_SDKWORK_ENVIRONMENT` | Environment label |

Missing values fall back to `import.meta.env.MODE` or `standalone` / `development`.
