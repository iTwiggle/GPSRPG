import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorageAdapter, resetStorageAdapter } from "./storage-adapter";

describe("web storage adapter", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    resetStorageAdapter();
  });

  it("propagates localStorage write failures to the caller", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("test quota");
      },
      removeItem: () => {},
    });

    expect(() => getStorageAdapter().setItem("test-key", "value")).toThrow(
      "test quota"
    );
  });
});
