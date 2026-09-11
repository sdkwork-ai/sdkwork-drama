# specs/

Purpose: repository/application-root spec system — cross-module machine contracts (topology manifests, composition outputs) that govern the whole `sdkwork-drama` repository.

Owner: sdkwork-drama maintainers.

Allowed: `README.md` index, `component.spec.json` machine contracts, narrowing extensions per `COMPONENT_SPEC.md`.

Forbidden: module-local contracts that belong in each module's own `specs/`, copied global spec bodies, secrets.

Related specs: `../sdkwork-specs/COMPONENT_SPEC.md`, `../sdkwork-specs/AGENTS_SPEC.md` (§4 Spec Resolution Order).

Verification: `node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .`
