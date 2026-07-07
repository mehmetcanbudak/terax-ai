# Pi sidebar release-readiness notes

Tracking note for the fork-local `pi-sidebar` delivery branch and the webview-native Pi size-fix tail. This file records the current repository state as of 2026-07-07 after the fork-local PR was refreshed to commit `e6563529d`. Older sidecar-era notes are historical only.

## Current PR state

- PR: <https://github.com/mehmetcanbudak/terax-ai/pull/1>
- Head branch: `pi-sidebar`
- Base branch: `main`
- Latest application-code head inspected: `e6563529da4747e119480708c28ffe505df89d36`
- Current pushed head: verify with `gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid`
- Upstream base inspected locally: `origin/main` at `78a0b3dd79554ad4af89e61d97004f3475cd9953`
- Local merge audit: `git merge-tree --write-tree HEAD origin/main` exits 0 and produced tree `782e0cfafdc9c074fdc90b678dde6c917e8a077b`.
- `gh pr view 1 --repo mehmetcanbudak/terax-ai` reported `mergeStateStatus=UNSTABLE` and `mergeable=MERGEABLE` while the latest Linux e2e job was still running.
- Most recently inspected check rollup for commit `e6563529d`: `frontend`, `rust`, `rust-test (windows-latest)`, `rust-test (macos-latest)`, and `coverage` were successful; `e2e (linux)` was still in progress. Final CI/e2e confirmation is deferred until all non-CI work is done.
- CI must independently run on the PR before release approval, including the Linux e2e job and the Pi approval spec.

## Completion audit checklist

| Status | Objective requirement | Evidence inspected | Remaining gap |
| --- | --- | --- | --- |
| Done | Commit and push `pi-sidebar`; open PR. | Fork PR #1 is open at <https://github.com/mehmetcanbudak/terax-ai/pull/1>; `fork/pi-sidebar` points at `e6563529d`. | None for fork-local PR creation and push. |
| Done | Resolve merge conflicts against current `origin/main`. | `git merge-tree --write-tree HEAD origin/main` exits 0 against `origin/main` `78a0b3dd79554ad4af89e61d97004f3475cd9953`; PR reports `mergeable=MERGEABLE`. | None locally. |
| Deferred | Confirm CI/e2e green. | Latest inspected PR check rollup had all non-e2e jobs successful and `e2e (linux)` in progress for `e6563529d`. The prior e2e failure was fixed by commit `e6563529d`, which added stable Pi approval controls and updated the e2e selector path. | Final CI/e2e confirmation is deferred until all non-CI work is done. |
| Blocked | Document and complete manual macOS Pi smoke pass: key save/load, chat, built-in agents, custom Zai endpoint auth, streaming, stop/resume, app restart restore, and window-close behavior. | `docs/pi-sidebar-manual-smoke-report.md` is a maintainer-fillable template covering each named flow, expected evidence, and secret-redaction guidance. | Maintainer must run it in a packaged app with real credentials/endpoints. |
| Done | Add security-critical mock-provider e2e coverage for Pi tool approval approve and deny through Rust `pi_agent_tool_execute`. | `e2e/specs/pi-approval.e2e.mjs` covers approve creating `e2e/.tmp/pi-approval-approved.txt` and deny leaving `e2e/.tmp/pi-approval-denied.txt` absent. `src/modules/pi/lib/webview-session.ts` routes the e2e sentinel through `pi_agent_tool_execute`. `src/modules/pi/components/PiTranscript.tsx` exposes `pi-tool-approval-approve` and `pi-tool-approval-deny` hooks. `scripts/check-pi-approval-boundary.mjs` guards the spec, sentinel prompts, WebdriverIO glob, and Linux e2e command. | Final Linux e2e pass is checked at the end with CI. |
| Partial by design | Complete Phase C/D convergence. | `src/modules/ai/lib/composerRuntime.ts` and tests cover the Pi-backed quick ask. `src/app/App.tsx` and `src/app/AppWorkspaceSurface.tsx` route the Pi composer path to Pi surfaces. `docs/phase-c-convergence-plan.md` records the residual import audit. `pnpm run check:pi-surface-isolation` guards that `AiChat`, `AiChatMessage`, `PlanDiffReview`, and `TodoStrip` stay isolated to the legacy mini-window fallback or tests. | Legacy fallback chat surfaces remain until the Pi composer runtime can become the default after CI/e2e and manual smoke are green. Runtime collapse/rename remains deferred. |
| Done | Handle touched cleanup and hardening items. | Evidence spans provider/model persistence tests in `src/modules/pi/lib/webview-session.test.ts`, MCP connection/error surfaces in `src/modules/pi/lib/useMcpSurface.ts` and `src-tauri/tests/mcp_manager_runtime.rs`, URLSearchParams proxy body handling in `src/modules/ai/lib/proxyFetch.ts`, retry UX in `src/modules/pi/components/PiComposer.test.tsx`, MCP `raw_data` capping in `src-tauri/src/modules/pi/native_tools/mcp_tools.rs`, historical sidecar-era docs marked superseded, `pnpm run check:no-pi-sidecar` guarding deleted sidecar routing flags like `USE_WEBVIEW_AGENT` and `sidecarBackend`, and Voice/3D gating in `src/modules/ai/lib/featureGates.ts` plus Rust capability manifests. | No known local code gap. |
| Blocked | Complete updater key rotation and verify fresh plus pre-rotation update paths. | `docs/updater-key-rotation.md` documents embedded key `52D6B9847A3B8F15`, workflow secret names `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, transition-release guidance, release-note variants, and old live feed key id `3BABFD8AB60E3469`. `docs/updater-key-rotation-smoke-report.md` is the maintainer-fillable evidence template. `pnpm check:updater-key-rotation` passed locally. `pnpm run inspect:updater-feed` remains the feed evidence command. | Maintainer must verify/configure signing secret values, produce a new-key signed release or test feed, decide transition release feasibility, put the selected migration note into the actual release notes, and verify signed update feeds. |
| Done | Keep default app about 11 MB. | Latest local signed-artifact-size carry-forward from the post-merge package check reported `10M` for `Terax.app` and `7.0M` for `Terax.app.tar.gz`. The latest `pnpm check:bundle-size` on `e6563529d` reported `1776.6 KB` gzipped JS against the `2050.8 KB` budget. | Re-run on the final signed release artifact. |
| Done | Keep Node Pi sidecar deleted. | `pnpm run check:no-pi-sidecar` passed as part of `pnpm check:pi-boundary`, scanning tracked paths, source routing flags, sidecar config, and sidecar-era docs for deleted `sidecars/pi-host`, bundled Node runtime paths, Pi-host build scripts, Tauri resource entries, `USE_WEBVIEW_AGENT` and `sidecarBackend` reintroductions, and required historical/superseded/not-current banners. Node Pi sidecar deleted. | Historical docs may mention the old sidecar only as past context and are guarded by automation. |
| Done | Ensure static frontend Tauri invokes have Rust handlers or intentional graceful degradation. | `pnpm run check:tauri-invokes` passed through `pnpm check:pi-boundary`, with all literal invokes mapped to Rust commands or documented feature-gated fallbacks. | Re-run after any new frontend invoke or Rust command changes. |
| Done locally | Pass pnpm and Rust verification gates. | Latest local checks after `e6563529d`: `pnpm test` passed 198 files and 1177 tests, `pnpm format:check` passed, `pnpm lint` exited 0 with baseline warnings, `pnpm check:pi-boundary` passed, `pnpm check:updater-key-rotation` passed, `pnpm check:bundle-size` passed, `pnpm check-types` passed, and `pnpm build` passed with existing Rolldown/Hugeicons `INVALID_ANNOTATION` warnings. Prior post-merge Rust validation passed `cargo fmt -- --check`, `cargo check --locked`, `cargo check --all-targets --locked`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked`, `cargo check --locked --features workflow`, `cargo check --locked --features openclicky`, `cargo test --locked --features workflow`, and `cargo test --locked --features openclicky`. | CI must independently run on the PR. |

## Latest local automated verification

Checks run or carried forward for the current code path:

```bash
pnpm test # 198 files, 1177 tests
pnpm format:check
pnpm lint # exits 0 with baseline warnings
pnpm exec tsc --noEmit
pnpm check:pi-boundary # approval, no-sidecar, surface isolation, invoke, release-doc, and CI-gate audits pass
pnpm check:updater-key-rotation
pnpm check:bundle-size # 1776.6 KB gzipped JS, budget 2050.8 KB
pnpm build # exits 0 with existing Rolldown/Hugeicons INVALID_ANNOTATION warnings

git rev-parse HEAD origin/main fork/pi-sidebar
git merge-tree --write-tree HEAD origin/main # exits 0
```

Rust checks previously completed on this branch and remain relevant because the latest changes touched only frontend e2e selectors, the Pi transcript test, and docs:

```bash
cd src-tauri && cargo fmt -- --check
cd src-tauri && cargo check --locked
cd src-tauri && cargo check --all-targets --locked
cd src-tauri && cargo clippy --locked --all-targets -- -D warnings
cd src-tauri && cargo test --locked
cd src-tauri && cargo check --locked --features workflow
cd src-tauri && cargo check --locked --features openclicky
cd src-tauri && cargo test --locked --features workflow
cd src-tauri && cargo test --locked --features openclicky
```

## Voice and 3D gating decision

Current decision for release: keep OpenClicky-derived AI tools and read-aloud TTS off by default. They are not part of the default size-fix path and their Rust commands are only registered with the `openclicky` feature. The frontend treats them as explicit experimental gates instead of ambient tools:

- `localStorage["terax.experimental.openclickyAiTools"] = "true"` exposes overlay, screenshot, and Tripo 3D AI tools plus the `/3d` command.
- `localStorage["terax.experimental.ttsReadAloud"] = "true"` exposes read-aloud buttons on legacy AI and Pi transcripts.
- Default builds do not advertise those tools to the model and do not show read-aloud actions that would invoke unregistered commands.
- When `openclicky` is enabled, `tts_speak`, `transcribe_audio`, and `generate_3d_model` record app capability-audit entries (`app.tts`, `app.transcription`, `app.3d_model`).

This does not disable the existing composer voice input path, which is a user-initiated MediaRecorder plus provider transcription flow and remains controlled by its existing key checks.

## Manual macOS Pi smoke checklist

These require an interactive packaged app and real configured provider credentials. They were not completed by the non-interactive agent session and must be run by a maintainer before release. Use `docs/pi-sidebar-manual-smoke-report.md` as the fillable evidence template.

| Status | Item | Evidence to record |
| --- | --- | --- |
| Pending | Key save/load | Save a Terax-managed provider key and a custom endpoint key, restart, verify model picker/key presence without diagnostics exposing the value. |
| Pending | Terax-managed Pi chat | Create a Pi session with a normal provider, send a short prompt, verify streaming transcript and final idle status. |
| Pending | Built-in/local agent cards | Refresh local agent detection; launch supported agents only into visible safe terminal commands. |
| Pending | Custom Zai/OpenAI-compatible endpoint auth | Configure a complete Zai-compatible endpoint, send a prompt, restart, verify the session keeps provider/model/custom endpoint metadata. |
| Pending | Session streaming | Verify progress/reasoning/output events and transcript persistence across a complete response. |
| Pending | Tool approval approve path | Trigger a harmless `write`/`edit`/`bash`, approve once, verify Rust-enforced execution and audit/tool timeline. |
| Pending | Tool approval deny path | Trigger the same class of tool, deny, verify no mutation/command side effect. |
| Pending | Stop/resume | Stop a running prompt, send a follow-up in the same session, verify transcript coherence. |
| Pending | App restart restore | Quit/reopen, verify sessions/events/transcripts/provider metadata restore and stale approvals are not actionable. |
| Pending | Window-close behavior | Close window/app during idle and during running or approval-pending session; verify no stuck running state or reusable stale approval after reopen. |
| Pending | Size spot-check | Re-run release bundle size on the signed final artifact; expected macOS app remains about 10-11 MB. |

## Release blockers / deferred until maintainer action

1. Confirm the final GitHub Actions matrix plus Linux e2e after all non-CI work is done.
2. Complete the manual macOS smoke checklist above with real credentials/endpoints.
3. Before release, finish updater key rotation per `docs/updater-key-rotation.md`: maintainer must wire/verify the new signing secrets, decide whether the recommended transition release is possible with the old key, and verify fresh plus pre-rotation update paths against a signed feed.
4. Promote Pi composer to default and collapse/rename residual runtime layers only after CI/e2e and manual smoke are green.
