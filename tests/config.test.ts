import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readConfig,
  writeConfig,
  resolveStoragePath,
  isAuthenticated,
  currentTier,
  currentQuota,
  TIER_QUOTAS,
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
    writeConfig({ apiToken: "tok_abcdef1234567890", tier: "pro", monthlyQuota: 2000 });
    const after = readConfig();
    expect(after.apiToken).toBe("tok_abcdef1234567890");
    expect(after.tier).toBe("pro");
    expect(after.monthlyQuota).toBe(2000);
  });

  it("writeConfig merges with existing config (does not overwrite)", () => {
    writeConfig({ apiToken: "tok_xxx" });
    writeConfig({ tier: "hobby" });
    const after = readConfig();
    expect(after.apiToken).toBe("tok_xxx");
    expect(after.tier).toBe("hobby");
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

  it("isAuthenticated reflects whether an API token is stored", () => {
    expect(isAuthenticated()).toBe(false);
    writeConfig({ apiToken: "tok_xxx" });
    expect(isAuthenticated()).toBe(true);
  });

  it("currentTier defaults to free when not set", () => {
    expect(currentTier()).toBe("free");
    writeConfig({ tier: "studio" });
    expect(currentTier()).toBe("studio");
  });

  it("currentQuota uses stored value or falls back to tier default", () => {
    expect(currentQuota()).toBe(TIER_QUOTAS.free);
    writeConfig({ tier: "hobby" });
    expect(currentQuota()).toBe(TIER_QUOTAS.hobby);
    writeConfig({ monthlyQuota: 9999 });
    expect(currentQuota()).toBe(9999);
  });

  it("TIER_QUOTAS has correct tier values (free is now 3 lifetime)", () => {
    expect(TIER_QUOTAS.free).toBe(3);
    expect(TIER_QUOTAS.hobby).toBe(200);
    expect(TIER_QUOTAS.pro).toBe(2000);
    expect(TIER_QUOTAS.studio).toBe(10000);
  });

  it("ensureDevice mints a stable id and label on first call", async () => {
    const { ensureDevice } = await import("../src/config.js");
    const a = ensureDevice();
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.label).toBeTruthy();
    // Idempotent — second call returns the same id
    const b = ensureDevice();
    expect(b.id).toBe(a.id);
    expect(b.label).toBe(a.label);
  });
});
