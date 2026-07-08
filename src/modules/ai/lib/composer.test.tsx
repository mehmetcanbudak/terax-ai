/**
 * @vitest-environment jsdom
 */
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PiProviderRuntimeConfig } from "@/modules/pi/lib/provider";
import type { PiSession } from "@/modules/pi/lib/sessions";

const chatRuntimeMock = vi.hoisted(() => ({
  getOrCreateChat: vi.fn(),
  sendMessage: vi.fn(),
  stop: vi.fn(),
}));

const webviewSessionMock = vi.hoisted(() => ({
  webviewSessionCreate: vi.fn(),
  webviewSessionSend: vi.fn(),
  webviewSessionStop: vi.fn(),
}));

vi.mock("../hooks/useWhisperRecording", () => ({
  useWhisperRecording: () => ({
    supported: false,
    hasKey: false,
    recording: false,
    transcribing: false,
    sttProvider: "openai",
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock("../store/chatRuntime", () => ({
  getOrCreateChat: chatRuntimeMock.getOrCreateChat,
}));

vi.mock("@/modules/pi/lib/webview-session", () => webviewSessionMock);

import { AiComposerProvider, useComposer } from "./composer";
import { useChatStore } from "../store/chatStore";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Root[] = [];

const piSession: PiSession = {
  id: "pi-1",
  title: "Quick ask",
  cwd: "/repo",
  status: "idle",
  createdAt: "2026-07-08T00:00:00.000Z",
  updatedAt: "2026-07-08T00:00:00.000Z",
  lastPrompt: null,
};

const providerConfig: PiProviderRuntimeConfig = {
  authMode: "terax",
  provider: "openai-compatible",
  modelId: "zai/glm-4.5",
  sourceModelId: "compat:zai",
  baseUrl: "https://z.ai/api/paas/v4",
  customEndpointId: "zai",
};

function SubmitHarness() {
  const composer = useComposer();
  useEffect(() => {
    composer.setValue("Use Pi runtime");
    // The test owns the provider lifetime and needs one initial prefill only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button type="button" data-testid="submit" onClick={composer.submit}>
      Send
    </button>
  );
}

function mount() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const root = createRoot(element);
  mounted.push(root);
  return { element, root };
}

function flushEffects() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("AiComposerProvider", () => {
  beforeEach(() => {
    chatRuntimeMock.getOrCreateChat.mockReset();
    chatRuntimeMock.sendMessage.mockReset();
    chatRuntimeMock.stop.mockReset();
    chatRuntimeMock.getOrCreateChat.mockReturnValue({
      sendMessage: chatRuntimeMock.sendMessage,
      stop: chatRuntimeMock.stop,
    });
    webviewSessionMock.webviewSessionCreate.mockReset();
    webviewSessionMock.webviewSessionSend.mockReset();
    webviewSessionMock.webviewSessionStop.mockReset();
    webviewSessionMock.webviewSessionSend.mockResolvedValue({
      accepted: true,
      session: piSession,
      events: [],
    });
    useChatStore.setState({
      activeSessionId: "legacy-chat-1",
      mini: { open: false },
    });
  });

  afterEach(async () => {
    for (const root of mounted.splice(0)) {
      await act(async () => root.unmount());
    }
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("sends through webviewSessionSend instead of legacy chat when the Pi composer flag is enabled", async () => {
    const { element, root } = mount();

    await act(async () => {
      root.render(
        <AiComposerProvider
          runtimeOptions={{
            pi: {
              enabled: true,
              context: {
                workspaceRoot: "/repo",
                activeCwd: "/repo",
                activeFile: "/repo/src/App.tsx",
                activeTerminalPrivate: false,
              },
              providerConfig,
              providerReady: true,
              selectedSessionId: "pi-1",
            },
          }}
        >
          <SubmitHarness />
        </AiComposerProvider>,
      );
      await flushEffects();
    });

    const button = element.querySelector('[data-testid="submit"]');
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("submit button missing");
    }

    await act(async () => {
      button.click();
      await flushEffects();
    });

    expect(webviewSessionMock.webviewSessionSend).toHaveBeenCalledWith(
      "pi-1",
      "Use Pi runtime",
      {
        workspaceRoot: "/repo",
        activeTerminalCwd: "/repo",
        activeFile: "/repo/src/App.tsx",
        activeTerminalPrivate: false,
      },
    );
    expect(chatRuntimeMock.getOrCreateChat).not.toHaveBeenCalled();
    expect(chatRuntimeMock.sendMessage).not.toHaveBeenCalled();
  });
});
