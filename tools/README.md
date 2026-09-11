# tools/

Purpose: repository-local developer tooling authored for `sdkwork-drama` (codegen helpers, verification glue, release helpers).

Owner: sdkwork-drama maintainers.

Allowed: Node.js (`.mjs`) and Rust helper tools owned by this repository, each documented at top of file.

Forbidden: global tools duplicated from `../sdkwork-specs/tools/` (call spec validators by relative path instead), secrets, generated artifacts.

Related specs: `../sdkwork-specs/CODE_STYLE_SPEC.md` (§7 Build Source Integrity), `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md` (§5 Node Script Resilience).

Verification: `node ../sdkwork-specs/tools/audit-repository-baseline.mjs --root .`
