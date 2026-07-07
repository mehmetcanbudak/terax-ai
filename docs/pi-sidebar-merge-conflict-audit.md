# Pi sidebar merge conflict audit

Generated on 2026-07-07 and refreshed for the fork-local PR #1 after resolving `origin/main` into `pi-sidebar`.

## Current result

The PR branch is no longer textually merge-conflicted with `origin/main` in the local repository:

```bash
git rev-parse HEAD origin/main fork/pi-sidebar
# latest application-code head inspected: 6d1bf0d7193aa6a3d7671b0d0054f379fb784458
# origin/main: 78a0b3dd79554ad4af89e61d97004f3475cd9953

git merge-tree --write-tree HEAD origin/main
# exits 0
# tree: b6b1744ec9fd0e0fde922ceb47dd02d857830db0
```

`git merge-tree --write-tree HEAD origin/main` exits 0. That means the current local branch can produce a clean merge tree with the fetched upstream main branch.

Fork PR status when last inspected:

```bash
gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid,mergeStateStatus,mergeable,statusCheckRollup
# mergeStateStatus: UNSTABLE while the latest e2e (linux) job was still running
# mergeable: MERGEABLE
# non-e2e checks inspected as successful: frontend, rust, rust-test (windows-latest), rust-test (macos-latest), coverage
```

Final CI/e2e confirmation is deferred until all non-CI work is done.

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

CI should be checked at the end of the non-CI cleanup pass. As of the last lightweight PR inspection, the fork-local CI run for `e6563529d` had successful non-e2e jobs and an in-progress Linux e2e job. The local application-code tail is now `6d1bf0d71`, so the e2e job should be rechecked after the remaining documentation and cleanup commits are pushed.

## Previously conflicted paths, now resolved

Before `b73b79aa`, the direct merge attempt reported 99 conflicted paths across workflows, package manifests, Rust backend modules, the app shell, editor, explorer, sidebar, status bar, tabs, terminal, theme, settings, styles, and Vite config. Those conflicts are now historical. The current local audit should use the commands above rather than the pre-resolution conflict list.

## Maintainer follow-up path

1. Confirm the final CI matrix and Linux e2e job are green after the remaining non-CI work is pushed.
2. Complete the manual macOS Pi smoke report in `docs/pi-sidebar-manual-smoke-report.md`.
3. Finish updater key rotation verification with maintainer-held signing secrets and a signed feed.
