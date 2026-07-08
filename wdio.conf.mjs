/**
 * WebdriverIO configuration for Terax end-to-end tests.
 *
 * The app is driven through `tauri-driver`, which bridges WebDriver to the
 * platform WebView (WebKitWebDriver on Linux, Edge WebDriver on Windows).
 *
 * IMPORTANT: `tauri-driver` supports Linux and Windows only. There is no macOS
 * WebDriver for WKWebView, so these specs run in CI (Linux) and on Windows,
 * not on the macOS dev machine. See e2e/README.md.
 *
 * Prerequisites (handled by CI, see .github/workflows/ci.yml):
 *   - `cargo install tauri-driver --locked`
 *   - the release binary built at src-tauri/target/release/terax
 *   - Linux: WebKitWebDriver on PATH (webkit2gtk driver package)
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const binaryName = process.platform === "win32" ? "terax.exe" : "terax";
const application = resolve(
  __dirname,
  "src-tauri",
  "target",
  "release",
  binaryName,
);

let tauriDriver;

const driverEnv = {
  ...process.env,
  TERAX_E2E: "1",
  // WebKitGTK 2.50+ can open a blank automation page under Xvfb when the
  // DMABuf renderer is enabled without a real GPU/DRM device. Keep CI on the
  // deterministic X11 software-rendered path.
  ...(process.platform === "linux"
    ? {
        GDK_BACKEND: "x11",
        NO_AT_BRIDGE: "1",
        WEBKIT_DISABLE_DMABUF_RENDERER: "1",
      }
    : {}),
};

async function collectPageState(activeBrowser, handle = undefined) {
  if (handle) {
    await activeBrowser.switchToWindow(handle);
  }

  const [url, title, source] = await Promise.all([
    activeBrowser.getUrl().catch((error) => `<url error: ${error}>`),
    activeBrowser.getTitle().catch((error) => `<title error: ${error}>`),
    activeBrowser
      .getPageSource()
      .catch((error) => `<source error: ${error}>`),
  ]);

  return { handle, url, title, source };
}

function isAppPage(state) {
  return (
    state.title === "Terax" ||
    state.source.includes('id="root"') ||
    state.source.includes('data-testid="tab-bar"')
  );
}

async function selectAppWindow(activeBrowser) {
  const deadline = Date.now() + 15000;
  let lastStates = [];

  while (Date.now() < deadline) {
    const handles = await activeBrowser.getWindowHandles();
    lastStates = [];

    for (const handle of handles) {
      const state = await collectPageState(activeBrowser, handle);
      lastStates.push(state);
      if (isAppPage(state)) {
        return;
      }
    }

    await activeBrowser.pause(500);
  }

  console.warn(
    `[e2e diagnostics] no app window found: ${lastStates
      .map(
        (state) =>
          `${state.handle ?? "<current>"} url=${state.url} title=${JSON.stringify(
            state.title,
          )} source=${state.source.slice(0, 300)}`,
      )
      .join(" | ")}`,
  );
}

export const config = {
  hostname: "127.0.0.1",
  port: 4444,

  specs: ["./e2e/specs/**/*.e2e.mjs"],

  // tauri-driver mediates a single native WebView session at a time.
  maxInstances: 1,

  capabilities: [
    {
      "tauri:options": {
        application,
      },
    },
  ],

  logLevel: "warn",
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },

  /**
   * Ensure the release binary exists before the run. Building is the caller's
   * job in CI (so failures surface in a dedicated step), but a local Linux run
   * gets a clear error instead of a cryptic driver crash.
   */
  onPrepare() {
    if (!existsSync(application)) {
      throw new Error(
        `Terax release binary not found at ${application}.\n` +
          "Build it first: pnpm build && cargo build --release --manifest-path src-tauri/Cargo.toml",
      );
    }
  },

  /**
   * Start tauri-driver before the WebDriver session opens, kill it after.
   * tauri-driver listens on 4444 and forwards to the native WebView driver.
   */
  beforeSession() {
    tauriDriver = spawn("tauri-driver", [], {
      env: driverEnv,
      stdio: [null, process.stdout, process.stderr],
    });
  },

  async before() {
    const activeBrowser = globalThis.browser;
    if (activeBrowser) {
      await selectAppWindow(activeBrowser);
    }
  },

  async afterTest(_test, _context, { passed }) {
    if (passed) {
      return;
    }

    const activeBrowser = globalThis.browser;
    if (!activeBrowser) {
      return;
    }

    try {
      const state = await collectPageState(activeBrowser);
      const domState = await activeBrowser
        .execute(() => ({
          bodyText: document.body.innerText?.slice(0, 1200) ?? "",
          chatReady: window.__TERAX_E2E_CHAT_READY__?.() ?? null,
          e2eFlag: window.localStorage.getItem("terax.e2e"),
          piState: (() => {
            const el = document.querySelector('[data-testid="pi-e2e-state"]');
            if (!(el instanceof HTMLElement)) return null;
            return {
              canCreateSession: el.dataset.canCreateSession ?? null,
              runtimeReady: el.dataset.runtimeReady ?? null,
              workspaceRoot: el.dataset.workspaceRoot ?? null,
            };
          })(),
        }))
        .catch((error) => ({ error: String(error) }));
      console.warn(
        `[e2e diagnostics] url=${state.url} title=${JSON.stringify(
          state.title,
        )} source=${state.source.slice(0, 500)} dom=${JSON.stringify(domState)}`,
      );
    } catch (error) {
      console.warn(`[e2e diagnostics] failed to collect page state: ${error}`);
    }
  },

  afterSession() {
    if (tauriDriver) {
      tauriDriver.kill();
      tauriDriver = undefined;
    }
  },
};

// Surface a friendly message if tauri-driver is not installed at all.
if (process.env.WDIO_VERIFY_DRIVER === "1") {
  const probe = spawnSync("tauri-driver", ["--help"], { encoding: "utf8" });
  if (probe.error) {
    throw new Error(
      "tauri-driver is not installed. Install it with: cargo install tauri-driver --locked",
    );
  }
}
