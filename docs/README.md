# docs/

Purpose: repository documentation layout. Canon entrypoints are `docs/product/prd/PRD.md` and `docs/architecture/tech/TECH_ARCHITECTURE.md`.

Owner: sdkwork-drama maintainers.

Allowed: product docs (`product/`), architecture docs (`architecture/`), runbooks and guides that reference (not copy) global specs.

Forbidden: duplicated global spec bodies, stale docs that contradict `sdkwork.app.config.json` or the crate layout, secrets.

Related specs: `../sdkwork-specs/DOCUMENTATION_SPEC.md`, `../sdkwork-specs/AGENTS_SPEC.md` (§9 verification).

Verification: `node ../sdkwork-specs/tools/check-repository-docs-standard.mjs --root .`

## Index

- Product: `product/prd/PRD.md`
- Architecture: `architecture/tech/TECH_ARCHITECTURE.md`
