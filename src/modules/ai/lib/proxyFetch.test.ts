import { invoke } from "@tauri-apps/api/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyFetch } from "./proxyFetch";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  Channel: class MockChannel<T> {
    onmessage: ((message: T) => void) | null = null;
  },
}));

function completeStream(args: unknown): void {
  const { onEvent } = args as {
    onEvent: { onmessage: ((message: unknown) => void) | null };
  };
  queueMicrotask(() => {
    onEvent.onmessage?.({ kind: "headers", status: 200, headers: {} });
    onEvent.onmessage?.({ kind: "end" });
  });
}

function decodeRequestBody(body: number[] | undefined): string {
  return new TextDecoder().decode(new Uint8Array(body ?? []));
}

describe("proxyFetch", () => {
  afterEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("infers form content-type for URLSearchParams bodies", async () => {
    vi.mocked(invoke).mockImplementation(async (_command, args) => {
      completeStream(args);
      return null;
    });

    await proxyFetch("https://api.example.test/token", {
      method: "POST",
      body: new URLSearchParams({ grant_type: "client credentials" }),
    });

    expect(invoke).toHaveBeenCalledWith(
      "ai_http_stream",
      expect.objectContaining({
        headers: expect.objectContaining({
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }),
    );
    const payload = vi.mocked(invoke).mock.calls[0][1] as {
      body: number[] | undefined;
    };
    expect(decodeRequestBody(payload.body)).toBe(
      "grant_type=client+credentials",
    );
  });

  it("preserves explicit content-type for URLSearchParams bodies", async () => {
    vi.mocked(invoke).mockImplementation(async (_command, args) => {
      completeStream(args);
      return null;
    });

    await proxyFetch("https://api.example.test/token", {
      method: "POST",
      headers: { "Content-Type": "application/custom-form" },
      body: new URLSearchParams({ a: "b" }),
    });

    expect(invoke).toHaveBeenCalledWith(
      "ai_http_stream",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/custom-form",
        }),
      }),
    );
  });
});
