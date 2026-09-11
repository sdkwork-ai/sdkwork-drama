# scripts/

Purpose: repository-local shell and Node scripts for development, verification, and packaging workflows of `sdkwork-drama`.

Owner: sdkwork-drama maintainers.

Allowed: scripts referenced from `package.json` scripts (including `_sdkwork:*` prefixed helpers), idempotent and documented at top of file.

Forbidden: secrets, global spec validator duplicates (call `../sdkwork-specs/tools/*` by relative path), ad-hoc destructive operations without confirmation.

Related specs: `../sdkwork-specs/CODE_STYLE_SPEC.md` (§7 Build Source Integrity), `../sdkwork-specs/PNPM_SCRIPT_SPEC.md` (§11 Clean Command Boundary), `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md` (§5 Node Script Resilience).

Verification: `node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .`
