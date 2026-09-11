# deployments/

Purpose: deployment assets for the `drama` application — Dockerfiles, compose files, and packaging definitions for the standalone gateway and assembly host.

Owner: sdkwork-drama maintainers.

Allowed: deployment profiles aligned with `sdkwork.app.config.json` (`supportedDeploymentProfiles: ["standalone", "cloud"]`), environment-specific composition referencing `etc/` values.

Forbidden: secrets baked into images, per-environment image forks (single image + environment-specific configuration), untracked large artifacts.

Related specs: `../sdkwork-specs/DEPLOYMENT_SPEC.md`, `../sdkwork-specs/ENVIRONMENT_SPEC.md`, `../sdkwork-specs/CONFIG_SPEC.md`.

## Assets

| Asset | Profile | Purpose |
| --- | --- | --- |
| `cloud/Dockerfile` | `cloud` | Single cloud container image for the standalone gateway binary |

Release packaging (tar.gz for `standalone` server and `cloud` container
targets) is defined by `sdkwork.workflow.json` and the thin packaging
workflow `.github/workflows/package.yml`.

## Smoke Test

After deployment, probe (in order): `/healthz`, `/readyz`,
`/app/v3/api/system/health`, `/app/v3/api/system/ready`.
