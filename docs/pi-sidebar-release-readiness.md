# Pi sidebar release-readiness notes

Tracking note for the fork-local `pi-sidebar` delivery branch and the webview-native Pi size-fix tail. This file records the current repository state as of 2026-07-08. Older sidecar-era notes are historical only. Current head and CI evidence are intentionally command-verified to avoid stale docs-only hashes.

## Current PR state

- PR: <https://github.com/mehmetcanbudak/terax-ai/pull/1>
- Head branch: `pi-sidebar`
- Base branch: `main`
- Latest application-code head inspected: verify with `git rev-parse HEAD` and `gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid`.
- Current pushed head: verify with `gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid`.
- Upstream base inspected locally: verify with `git rev-parse origin/main`.
- Local merge audit: `git merge-tree --write-tree HEAD origin/main` exits 0.
- `gh pr view 1 --repo mehmetcanbudak/terax-ai --json mergeStateStatus,mergeable,statusCheckRollup` must report `mergeStateStatus=CLEAN`, `mergeable=MERGEABLE`, and `frontend`, `rust`, `rust-test (windows-latest)`, `rust-test (macos-latest)`, `coverage`, and `e2e (linux)` with `SUCCESS` for the current pushed head.
- CI independently runs on the PR, including the Linux e2e job and the Pi approval spec. Re-check the current pushed head after any later code or docs tail commit.

## Completion audit checklist

| Status | Objective requirement | Evidence inspected | Remaining gap |
| --- | --- | --- | --- |
| Done | Commit and push `pi-sidebar`; open PR. | Fork PR #1 is open at <https://github.com/mehmetcanbudak/terax-ai/pull/1>; the branch is pushed and the current head is verified with `gh pr view`. | None for fork-local PR creation and push. |
| Done | Resolve merge conflicts against current `origin/main`. | `git merge-tree --write-tree HEAD origin/main` exits 0 against the current fetched `origin/main`; PR reports `mergeable=MERGEABLE` and `mergeStateStatus=CLEAN` for the latest inspected green check rollup. | None locally after the latest merge audit. |
| Done | Confirm CI/e2e green. | `gh pr view 1 --repo mehmetcanbudak/terax-ai --json headRefOid,mergeStateStatus,mergeable,statusCheckRollup` is the source of truth for the current pushed head. The latest e2e fix uses DOM clicks for transcript approval controls that WebDriver saw but could not click directly under WebKit content visibility. | Re-check after every new pushed commit. |
| Blocked | Document and complete manual macOS Pi smoke pass: key save/load, chat, built-in agents, custom Zai endpoint auth, streaming, stop/resume, app restart restore, and window-close behavior. | `docs/pi-sidebar-manual-smoke-report.md` is a maintainer-fillable template covering each named flow, expected evidence, and secret-redaction guidance. | Maintainer must run it in a packaged app with real credentials/endpoints. |
| Done | Add security-critical mock-provider e2e coverage for Pi tool approval approve and deny through Rust `pi_agent_tool_execute`. | `e2e/specs/pi-approval.e2e.mjs` covers approve creating `e2e/.tmp/pi-approval-approved.txt` and deny leaving `e2e/.tmp/pi-approval-denied.txt` absent. `src/modules/pi/lib/webview-session.ts` routes the e2e sentinel through `pi_agent_tool_execute`. `src/modules/pi/components/PiTranscript.tsx` exposes `pi-tool-approval-approve` and `pi-tool-approval-deny` hooks. `scripts/check-pi-approval-boundary.mjs` guards the spec, sentinel prompts, WebdriverIO glob, and Linux e2e command. The PR `e2e (linux)` statusCheckRollup is the release gate for this spec. | None. |
| Partial by design | Complete Phase C/D convergence. | `src/modules/ai/lib/composerRuntime.ts`, `AiComposerProvider`, and tests cover the Pi-backed quick ask through `useComposerRuntime`. `src/app/App.tsx`, `src/modules/statusbar/StatusBar.tsx`, and `src/modules/ai/components/AiStatusBarControls.tsx` route the flagged Pi composer path to the Pi code panel rather than `AiMiniWindow`. `docs/phase-c-convergence-plan.md` records the residual import audit. `pnpm run check:pi-surface-isolation` guards that `AiChat`, `AiChatMessage`, `PlanDiffReview`, and `TodoStrip` stay isolated to the legacy mini-window fallback or tests. | Legacy fallback chat surfaces remain until the Pi composer runtime can become the default after PR CI/e2e, manual smoke, and updater verification are green. Runtime collapse/rename remains deferred. |
| Done | Handle touched cleanup and hardening items. | Evidence spans provider/model persistence tests in `src/modules/pi/lib/webview-session.test.ts`, MCP connection/error surfaces in `src/modules/pi/lib/useMcpSurface.ts` and `src-tauri/tests/mcp_manager_runtime.rs`, URLSearchParams proxy body handling and regression coverage in `src/modules/ai/lib/proxyFetch.ts` and `src/modules/ai/lib/proxyFetch.test.ts`, retry UX in `src/modules/pi/components/PiComposer.test.tsx`, MCP `raw_data` capping in `src-tauri/src/modules/pi/native_tools/mcp_tools.rs`, historical sidecar-era docs marked superseded, `pnpm run check:no-pi-sidecar` guarding deleted sidecar routing flags like `USE_WEBVIEW_AGENT` and `sidecarBackend`, and Voice/3D gating in `src/modules/ai/lib/featureGates.ts` plus Rust capability manifests. | No known local code gap. |
| Blocked | Complete updater key rotation and verify fresh plus pre-rotation update paths. | `docs/updater-key-rotation.md` documents embedded key `52D6B9847A3B8F15`, workflow secret names `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, transition-release guidance, release-note variants, and old live feed key id `3BABFD8AB60E3469`. `docs/updater-key-rotation-smoke-report.md` is the maintainer-fillable evidence template. `pnpm check:updater-key-rotation` passed locally. `pnpm run inspect:updater-feed` remains the feed evidence command. | Maintainer must verify/configure signing secret values, produce a new-key signed release or test feed, decide transition release feasibility, put the selected migration note into the actual release notes, and verify signed update feeds. |
| Done | Keep default app about 11 MB. | Latest local unsigned package check reported `11M` for `Terax.app` and `6.6M` for `Terax.app.tar.gz`. The latest `pnpm check:bundle-size` reported `1779.1 KB` gzipped JS against the `2050.8 KB` budget. | Re-run on the final signed release artifact. |
| Done | Keep Node Pi sidecar deleted. | `pnpm run check:no-pi-sidecar` passed as part of `pnpm check:pi-boundary`, scanning tracked paths, source routing flags, sidecar config, and sidecar-era docs for deleted `sidecars/pi-host`, bundled Node runtime paths, Pi-host build scripts, Tauri resource entries, `USE_WEBVIEW_AGENT` and `sidecarBackend` reintroductions, and required historical/superseded/not-current banners. Node Pi sidecar deleted. | Historical docs may mention the old sidecar only as past context and are guarded by automation. |
| Done | Ensure static frontend Tauri invokes have Rust handlers or intentional graceful degradation. | `pnpm run check:tauri-invokes` passed through `pnpm check:pi-boundary`, with all literal invokes mapped to Rust commands or documented feature-gated fallbacks. | Re-run after any new frontend invoke or Rust command changes. |
| Done | Pass pnpm and Rust verification gates. | Local checks after the latest tail: targeted composer runtime tests, `pnpm test` passed 200 files and 1180 tests, `pnpm check-types`, `pnpm format:check`, `pnpm lint` exited 0 with baseline warnings, `pnpm check:pi-boundary`, `pnpm check:updater-key-rotation`, `git diff --check`, `pnpm build`, and `pnpm check:bundle-size` passed at `1779.1 KB`. Earlier local `pnpm tauri build --bundles app --no-sign --ci` produced an `11M` app plus `6.6M` updater tarball. The PR statusCheckRollup covers frontend, Rust default/workflow/openclicky matrix coverage, coverage, and Linux e2e for the current pushed head. | None for automated gates after current PR CI is green. |

## Latest local automated verification

Checks run or carried forward for the current code path:

```bash
pnpm test # 200 files, 1180 tests
pnpm test src/modules/ai/lib/proxyFetch.test.ts src/modules/pi/bridge/pi-http.test.ts # 2 files, 8 tests
pnpm exec vitest run src/modules/ai/lib/composer.test.tsx src/modules/ai/lib/composerRuntime.test.ts # Pi composer runtime seam
pnpm format:check
pnpm lint # exits 0 with baseline warnings
pnpm check-types
pnpm check:pi-boundary # approval, no-sidecar, surface isolation, invoke, release-doc, and CI-gate audits pass
pnpm check:updater-key-rotation
pnpm check:bundle-size # 1779.1 KB gzipped JS, budget 2050.8 KB
pnpm build # exits 0 with existing Rolldown/Hugeicons INVALID_ANNOTATION warnings
pnpm tauri build --bundles app --no-sign --ci # 11M Terax.app, 6.6M updater tarball

git rev-parse HEAD origin/main fork/pi-sidebar
git merge-tree --write-tree HEAD origin/main # exits 0
```

Rust checks are also covered by PR CI. Prior local Rust checks remain relevant because the latest changes touched frontend TypeScript composer/runtime wiring, shortcut routing, package metadata, tests, e2e selectors, the Pi transcript test, and docs:

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

1. Complete the manual macOS smoke checklist above with real credentials/endpoints.
2. Before release, finish updater key rotation per `docs/updater-key-rotation.md`: maintainer must wire/verify the new signing secrets, decide whether the recommended transition release is possible with the old key, and verify fresh plus pre-rotation update paths against a signed feed.
3. Promote Pi composer to default and collapse/rename residual runtime layers only after PR CI, manual smoke, and updater verification are green.
