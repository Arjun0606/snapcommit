import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readConfig,
  writeConfig,
  resolveStoragePath,
  hasPro,
  getApiKey,
} from "../src/config.js";

// config.ts re-reads from $HOME on every call, so we can swap HOME per-test.
let originalHome: string | undefined;
let tempHome: string;

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), "snapcommit-config-test-"));
  originalHome = process.env.HOME;
  process.env.HOME = tempHome;
  delete process.env.SNAPCOMMIT_STORAGE;
});

afterEach(() => {
  if (originalHome) process.env.HOME = originalHome;
  else delete process.env.HOME;
  rmSync(tempHome, { recursive: true, force: true });
});

describe("config", () => {
  it("readConfig returns empty when no file exists", () => {
    expect(readConfig()).toEqual({});
  });

  it("writeConfig persists values across reads", () => {
    writeConfig({ preferredProvider: "openai", openaiApiKey: "sk-test123456789012345" });
    const after = readConfig();
    expect(after.preferredProvider).toBe("openai");
    expect(after.openaiApiKey).toBe("sk-test123456789012345");
  });

  it("writeConfig merges with existing config (does not overwrite)", () => {
    writeConfig({ anthropicApiKey: "ant-key" });
    writeConfig({ openaiApiKey: "oai-key" });
    const after = readConfig();
    expect(after.anthropicApiKey).toBe("ant-key");
    expect(after.openaiApiKey).toBe("oai-key");
  });

  it("resolveStoragePath honors SNAPCOMMIT_STORAGE env var", () => {
    process.env.SNAPCOMMIT_STORAGE = "/tmp/override.db";
    expect(resolveStoragePath()).toBe("/tmp/override.db");
  });

  it("resolveStoragePath falls back to config.storagePath", () => {
    writeConfig({ storagePath: "/tmp/from-config.db" });
    expect(resolveStoragePath()).toBe("/tmp/from-config.db");
  });

  it("resolveStoragePath defaults to ~/.snapcommit-mcp/memories.db", () => {
    expect(resolveStoragePath()).toBe(join(tempHome, ".snapcommit-mcp", "memories.db"));
  });

  it("hasPro returns true only when license is active", () => {
    expect(hasPro()).toBe(false);
    writeConfig({ licenseStatus: "active" });
    expect(hasPro()).toBe(true);
    writeConfig({ licenseStatus: "expired" });
    expect(hasPro()).toBe(false);
  });

  it("getApiKey returns preferred provider's key when set", () => {
    writeConfig({
      anthropicApiKey: "ant-1234567890123456",
      openaiApiKey: "oai-1234567890123456",
      preferredProvider: "openai",
    });
    expect(getApiKey()).toEqual({ provider: "openai", key: "oai-1234567890123456" });
  });

  it("getApiKey returns null when no keys configured", () => {
    expect(getApiKey()).toBeNull();
  });
});
