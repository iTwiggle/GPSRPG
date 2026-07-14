import { afterEach, describe, expect, it, vi } from "vitest";

describe("DEV_TOOLS_ENABLED", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("is enabled during local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "");

    const { DEV_TOOLS_ENABLED } = await import("./runtime-flags");
    expect(DEV_TOOLS_ENABLED).toBe(true);
  });

  it("is disabled in production unless explicitly flagged", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "");

    const { DEV_TOOLS_ENABLED } = await import("./runtime-flags");
    expect(DEV_TOOLS_ENABLED).toBe(false);
  });

  it("can be enabled for flagged preview builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "1");

    const { DEV_TOOLS_ENABLED } = await import("./runtime-flags");
    expect(DEV_TOOLS_ENABLED).toBe(true);
  });
});
