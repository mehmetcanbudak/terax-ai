# Pi sidebar merge conflict audit

Generated on 2026-07-07 and refreshed for the fork-local PR #1 after resolving `origin/main` into `pi-sidebar`.

## Current result

The PR branch is no longer textually merge-conflicted with `origin/main` in the local repository:

```bash
git rev-parse HEAD origin/main fork/pi-sidebar
# latest application-code head: verify with git rev-parse HEAD
# origin/main: verify with git rev-parse origin/main

git merge-tree --write-tree HEAD origin/main
# exits 0
```

`git merge-tree --write-tree HEAD origin/main` exits 0. That means the current local branch can produce a clean merge tree with the fetched upstream main branch.

Fork PR status when last inspected:

```bash
gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid,mergeStateStatus,mergeable,statusCheckRollup
# mergeStateStatus: CLEAN
# mergeable: MERGEABLE
# successful checks: frontend, rust, rust-test (windows-latest), rust-test (macos-latest), coverage, e2e (linux)
```

The PR statusCheckRollup is the source of truth for the current pushed head and must show Linux e2e success before merge.

## Resolution commit

The broad conflict set was resolved in:

```text
b73b79aa1501d36c888d609affd4b9be644b8c58 chore(merge): resolve origin main into pi sidebar
```

The merge preserved the webview-native Pi boundary:

- no Node Pi sidecar or `sidecars/pi-host` reintroduction;
- frontend Pi tool execution still routes through Rust-enforced `pi_agent_tool_execute`;
- static frontend Tauri invokes have registered Rust handlers or documented feature-gated degradation;
- `resources/sidecars` remains absent from Tauri bundling for the deleted Node Pi sidecar path.

## CI/e2e state after conflict resolution

CI is checked with `gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid,mergeStateStatus,mergeable,statusCheckRollup`. Re-check the current pushed head after any later code or docs tail commit and require `frontend`, `rust`, `rust-test (windows-latest)`, `rust-test (macos-latest)`, `coverage`, and `e2e (linux)` to pass.

## Previously conflicted paths, now resolved

Before `b73b79aa`, the direct merge attempt reported 99 conflicted paths across workflows, package manifests, Rust backend modules, the app shell, editor, explorer, sidebar, status bar, tabs, terminal, theme, settings, styles, and Vite config. Those conflicts are now historical. The current local audit should use the commands above rather than the pre-resolution conflict list.

## Maintainer follow-up path

1. Complete the manual macOS Pi smoke report in `docs/pi-sidebar-manual-smoke-report.md`.
2. Finish updater key rotation verification with maintainer-held signing secrets and a signed feed.
