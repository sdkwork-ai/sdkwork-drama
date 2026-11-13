# sdkwork-drama-pc Guidelines

## SDKWORK Soul

Read `../../../sdkwork-specs/SOUL.md` before executing surface tasks. The repository root `AGENTS.md` remains the first authority; this file narrows it for the PC surface.

## SDKWORK Standards

This surface follows the repository root `AGENTS.md` and `../../../sdkwork-specs/README.md`. Do not copy global standards locally.

## Application Identity

Application: `sdkwork-drama`
Surface: `pc` (`PC`)
Architecture standard: `APP_PC_ARCHITECTURE_SPEC.md`
UI standard: `APP_PC_REACT_UI_SPEC.md`

The repository root `agent.app.config.json` owns identity. This surface owns only its application root.

## Local Dictionary Structure

- `src/` — thin shell: bootstrap, layout, and entry.
- `packages/` — business packages, added when the first workflow lands.
- `specs/` — local component contract.
- `public/` — browser-served static assets only.
- `config/` — surface-local configuration profiles when needed.
- `tests/` — surface-level tests.

## Spec Resolution Order

1. Repository root `AGENTS.md`.
2. This file and `specs/component.spec.json`.
3. `../../../sdkwork-specs/README.md`.
4. `../../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`.
5. `../../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`.
6. Implementation files.

## Required Specs By Task Type

| Task | Required specs |
| --- | --- |
| Any code change | `CODE_STYLE_SPEC.md`, `NAMING_SPEC.md`, `TYPESCRIPT_CODE_SPEC.md` |
| UI or page work | `FRONTEND_CODE_SPEC.md`, `FRONTEND_SPEC.md`, `UI_ARCHITECTURE_SPEC.md`, `APP_PC_REACT_UI_SPEC.md` |
| Architecture or package boundary | `APP_PC_ARCHITECTURE_SPEC.md`, `APPLICATION_SPEC.md`, `APP_COMPOSITION_SPEC.md` |
| SDK integration | `APP_SDK_INTEGRATION_SPEC.md`, `SDK_SPEC.md`, `CONFIG_SPEC.md` |
| Runtime config | `CONFIG_SPEC.md`, `ENVIRONMENT_SPEC.md`, `SOURCE_CONFIG_SPEC.md` |
| Build runner | `CODE_STYLE_SPEC.md` §7, `TYPESCRIPT_CODE_SPEC.md` §5, `PNPM_SCRIPT_SPEC.md` §11 |

## Code Style Rules

- Keep `src/` thin. Business behavior does not belong in `App.tsx`.
- Use strict TypeScript. No `any`, unchecked casts, or silent error swallowing.
- UI never constructs raw HTTP clients, auth headers, or SDK clients.
- Add feature packages with their own `specs/component.spec.json`.
- Keep accessibility: semantic landmarks, visible focus, reduced-motion support.
- Do not hand-edit generated SDK or build output.

## Build, Test, and Verification

```bash
pnpm --dir apps/sdkwork-drama-pc typecheck
pnpm --dir apps/sdkwork-drama-pc build
pnpm check
```

## Agent Execution Rules

- Read the repository root `AGENTS.md` before this surface.
- Keep changes scoped to this surface unless the task explicitly spans surfaces.
- Do not edit the other browser surface's UI or copy its shell.
- Stop and report when an architecture or SDK boundary is ambiguous.
- Development happens on `main`.

## App SDK Consumer Imports

No generated SDK client is wired at scaffold time. When one is added, consume only `@sdkwork/*-app-sdk` package entrypoints per `../../../sdkwork-specs/APP_SDK_INTEGRATION_SPEC.md` §9.

## HTTP API Response Envelope

This surface owns no HTTP API. If a local runtime surface is added, follow `../../../sdkwork-specs/API_SPEC.md` §4.5 and §14-§16 without weakening the envelope.

## Human Review Rules

Review is required for first-workflow architecture, SDK wiring, auth/session behavior, runtime config, deployment changes, and any new package boundary.

<!-- SDKWORK-MAIN-BRANCH-STANDARD: v1 -->
## Main-Branch Development

Authority: `../../../sdkwork-specs/REPOSITORY_BASELINE_SPEC.md` section 1.

Development happens on `main`. Everything authored in this repository is committed onto `main`.

- A working tree that receives authored content MUST have `main` checked out as its current branch
  for the whole time that work is in progress. Commit onto `main` directly; do not commit onto a
  branch a later merge is expected to bring in.
- A detached HEAD MUST NOT be used as a development venue. A commit created while HEAD is detached
  from every branch is reachable only through the reflog — absent from every branch history, from a
  fresh `git clone` of this repository, and from every other working tree — so the work it carries
  is one `git gc` away from being unrecoverable. Do not check out a bare commit, a tag, or an older
  ref in order to "get a clean starting point" and commit there.
- A side branch MUST NOT be used as a development venue either. There is no long-lived feature,
  release, maintenance, or personal branch, and this repository MUST NOT accumulate local commits
  that `main` cannot reach: making them findable would then depend on a merge that may never happen.
- A checkout off `main` is legitimate only while it stays read-only — a dependency or SDK pinned to
  an explicit commit, a release artifact checkout, or a bisect. No authored change is committed there.
- A working tree found detached, or on a branch other than `main`, with work in it is a STOP, not a
  cleanup. Do not move refs, do not rewrite history, and do not discard the commits. Report the
  branch, the commits, and the state, and let a human decide: moving commits onto `main` and
  discarding work are both governed by `../../../sdkwork-specs/DESTRUCTIVE_OPERATION_SPEC.md` and
  `../../../sdkwork-specs/ROLLBACK_RESTRICTION_SPEC.md`.

Verification (from the repository root):

```bash
node ../../../sdkwork-specs/tools/audit-repository-baseline.mjs --root . --only branch-main
node ../../../sdkwork-specs/tools/sync-agent-main-branch-standard.mjs --root . --check
```

The first fails when the current branch is anything other than `main`, and reports a detached HEAD
as `detached`. The second fails when this block is out of date.
<!-- /SDKWORK-MAIN-BRANCH-STANDARD: v1 -->

<!-- SDKWORK-DESTRUCTIVE-OPERATION-STANDARD: v1 -->
## Destructive Operation Safety

Authority: `../../../sdkwork-specs/DESTRUCTIVE_OPERATION_SPEC.md`.

Deletion must be explicit, enumerated, and reviewable. Deleting by pattern instead of by named
path is forbidden. Wildcards are for read-only commands only.

- `git rm -r`, `git rm` over a directory or pattern, and `git clean -f`/`-fd`/`-fdx` are
  FORBIDDEN. A recursive `git rm` stages many deletions in one index transaction; if the process
  is interrupted (SIGTERM, timeout, sandbox kill, crash) entries are already gone from disk while
  the index is only half-written, which is silent non-atomic mass data loss.
- Delete tracked files with `rm <exact/path>` on each named path, let `git status --short`
  record the `D` entries, then stage only the enumerated paths. Commit the deletion separately
  from functional changes.
- Shell and script deletion by wildcard is FORBIDDEN: `rm -rf`/`rm -r`/`rm -f` with
  `*`/`**`/`?`/`[...]`/brace expansion, `find ... -delete`, `find ... -exec rm`,
  `find ... | xargs rm`, `for f in *; do rm ...`, `del /S /Q`, `rd /S /Q`,
  `Remove-Item -Recurse -Force` on a glob, `shutil.rmtree`, `fs.rm(dir, { recursive: true })`,
  and `rimraf` over a glob.
- A deletion MUST NOT be combined in one shell invocation with a build, install, network, or
  publish step, and MUST NOT derive its targets from an unvalidated argument, environment
  variable, or configuration value.
- Permitted narrow deletion: `rm <exact/path>`; a short literal path list owned by the tool that
  declares it; the module's own generated artifacts through its owning tool
  (`pnpm clean`, `cargo clean`) per `CODE_STYLE_SPEC.md` §7; and
  `git restore --worktree --source=HEAD -- <exact paths>`.
- Required sequence before any deletion: enumerate exact paths; confirm every path resolves inside
  the active repository or module root; classify tracked/generated/cached/unknown; prefer `rm`
  plus tracked `git status`; delete in batches of 20 or fewer with a status check between
  batches; report the removed paths and the authorizing decision.
- Request explicit human confirmation before deleting any git-tracked path, any directory tree,
  any path resolving outside the active repository root, or more than 20 paths.
- Recovery after an accidental mass deletion: clear a stale `.git/index.lock`, write the path
  list to a file INSIDE the repository (never `/tmp` on Windows, where the Git Bash path space
  and the native tool path space disagree), and run a single
  `git restore --worktree --pathspec-from-file=<repo-relative-list>`. Never loop one
  version-control call per path; the same termination cause interrupts the loop part-way.

Verification (from the repository root):

```bash
node ../../../sdkwork-specs/tools/sync-agent-destructive-operation-standard.mjs --root . --check
```
<!-- /SDKWORK-DESTRUCTIVE-OPERATION-STANDARD: v1 -->

<!-- SDKWORK-ROLLBACK-RESTRICTION-STANDARD: v1 -->
## Rollback Restriction And Fix-Forward Discipline

Authority: `../../../sdkwork-specs/ROLLBACK_RESTRICTION_SPEC.md`.

Errors are fixed forward. Version-control history is never rewound to make an error disappear.

- A rollback is any operation that moves a ref, resets the index or the working tree to an earlier
  state, discards uncommitted or committed work, or rewrites published history. It is FORBIDDEN as
  the remedy for a defect — a build failure, a type error, a lint failure, a failing test, a merge
  conflict, a runtime regression, a bad refactor, or an unclear diff. Repair forward instead, by
  adding, editing, or restoring content through a new commit.
- FORBIDDEN by an agent or a human-issued command: `git reset --hard` in any form;
  `git reset --merge`/`--keep`; `git reset <ref>` that discards staged or working-tree content;
  `git checkout -f`, `git switch -f`, `git restore --source=<ref> --worktree .`;
  `git revert` as a reflex error remedy; `git stash drop`/`clear` and `git stash pop` over a
  conflict; `git branch -D` on a branch with unmerged work; `git update-ref -d` and direct
  `.git/refs/` edits; `git reflog expire`, `git gc --prune=now`, `git prune`;
  `git commit --amend` over a pushed commit; `git rebase`, `git rebase -i`, `git rebase --onto`;
  `git filter-branch`; `git push --force`, `git push --force-with-lease`, and
  `git push --delete`.
- A rollback is never inferred from context or tone. "Fix it", "it's broken", "this is a mess",
  "start over", "just revert it", and "退回" are not rollback instructions. If the intent is
  ambiguous, STOP and ask — including whether the instruction means to discard work or to restore
  lost work, because that distinction decides the permissible operation.
- Discarding work requires a separate, explicit, human-issued instruction that names the operation,
  the target ref, the discarded span, and the reason, and that acknowledges the loss. The
  authorization must be quoted in the commit message. A standing authorization is not accepted.
- Recovery is ADDITIVE: `git restore --worktree --source=<ref> -- <exact paths>`, or
  `git checkout <good-ref> --pathspec-from-file=<repo-relative-list>` with the list written inside
  the repository. The pathspec must be an explicit enumerated list — never a directory, glob, brace
  expansion, or the repository root — and a restore is never combined with a build, install,
  publish, or commit step in the same shell invocation.
- Before a bulk restore: commit any local modification as a checkpoint; create a backup branch AND a
  tag AND a patch file and verify they point at the pre-restore state; produce a written
  three-snapshot blob comparison (damaged revision vs its parent vs the candidate older snapshot)
  that separates REPLACED files from files the damaged revision legitimately AUTHORED; restore the
  relative complement, not the whole tree; and keep the files the damaged revision added.
- Never treat a local tracking ref as evidence about a remote. Confirm with
  `git ls-remote <remote> <branch>` and record the returned object id.
- After a restore, verify by content hash rather than by reading files, re-run the gates that cover
  the restored surface, and classify each remaining failure as caused-by-the-restore or
  pre-existing. A pre-existing claim must be proven by showing the same failure at the prior
  revision with `git show <ref>:<path>`, not reasoned about. Fix forward. Never un-restore.
- Never bypass a hook, signature, or gate with `--force`, `--no-verify`, or `--no-gpg-sign` to
  land a repair.

Verification (from the repository root):

```bash
node ../../../sdkwork-specs/tools/sync-agent-rollback-restriction-standard.mjs --root . --check
```
<!-- /SDKWORK-ROLLBACK-RESTRICTION-STANDARD: v1 -->


