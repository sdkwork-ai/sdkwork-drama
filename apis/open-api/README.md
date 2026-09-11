# apis/open-api/

Purpose: SDKWork-owned business `open-api` contract authority for the `drama` application. Omitted `x-sdkwork-wire-protocol` means SDKWork-owned custom API (`sdkwork-v3`).

Owner: sdkwork-drama maintainers.

Allowed: `openapi.yaml` documents, split schema files referenced from the root document.

Forbidden: third-party compatibility documents without operation-level `x-sdkwork-wire-protocol: external` + `x-sdkwork-external-protocol-id`, generated SDK output.

Related specs: `../sdkwork-specs/API_SPEC.md` (§4.5 envelope, §14-16 operation matrix), `../sdkwork-specs/PAGINATION_SPEC.md`.

Verification: `node ../sdkwork-specs/tools/check-api-operation-patterns.mjs --root .`
