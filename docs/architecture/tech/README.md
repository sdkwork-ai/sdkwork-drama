# Tech Architecture Directory

Canon technical architecture for `sdkwork-drama`.

## Canon Directory Splitting Rules

- `TECH_ARCHITECTURE.md` is the single Canon entrypoint for architecture.
  Do not fork architecture decisions into other files; extend it in place.
- Per-module integration contracts live in each module's own `specs/`
  directory (`COMPONENT_SPEC.md`), not here. This directory holds human
  narrative only.
- Global normative standards are never copied here — they stay in
  `../sdkwork-specs/` and are linked by relative path.
- Rewriting or deleting `TECH_ARCHITECTURE.md` requires human review per
  `../../AGENTS.md` Human Review Rules.

Related: `../../AGENTS.md`, `../../../sdkwork-specs/DOCUMENTATION_SPEC.md`.
