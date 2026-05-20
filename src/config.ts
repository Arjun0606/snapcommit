/**
 * User configuration. Plain JSON at ~/.snapcommit-mcp/config.json
 *
 * The storage path determines where memories.db lives. By default it's local
 * (~/.snapcommit-mcp/memories.db) — fast, private, no sync. Users who want
 * cross-device or team sharing point it at a cloud-synced folder.
 *
 * BYOK API keys live here too. Encrypted? No — the file is chmod 600 in the
 * user's home directory, same trust level as ~/.aws/credentials or ~/.npmrc.
 */
import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

export interface UserConfig {
  /** Where memories.db lives. Defaults to ~/.snapcommit-mcp/memories.db. */
  storagePath?: string;
  /** Anthropic API key (Pro features). BYOK — we never see it. */
  anthropicApiKey?: string;
  /** OpenAI API key (Pro features). BYOK. */
  openaiApiKey?: string;
  /** Preferred provider for Pro AI calls. */
  preferredProvider?: "anthropic" | "openai";
  /** Pro license key from Dodo Payments. */
  licenseKey?: string;
  /** Last verified license state (cached locally). */
  licenseStatus?: "active" | "expired" | "invalid" | "unknown";
  /** Last verification timestamp. */
  licenseVerifiedAt?: string;
}

function configDir(): string {
  return join(homedir(), ".snapcommit-mcp");
}

function configPath(): string {
  return join(configDir(), "config.json");
}

export function readConfig(): UserConfig {
  const path = configPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as UserConfig;
  } catch {
    return {};
  }
}

export function writeConfig(patch: Partial<UserConfig>): UserConfig {
  const current = readConfig();
  const merged: UserConfig = { ...current, ...patch };
  const path = configPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(merged, null, 2));
  try {
    chmodSync(path, 0o600);
  } catch {
    // ignore on systems that don't support chmod
  }
  return merged;
}

/**
 * Storage path resolution order:
 *   1. SNAPCOMMIT_STORAGE env var (highest priority — for CI, testing, override)
 *   2. config.storagePath from user config
 *   3. Default: ~/.snapcommit-mcp/memories.db
 */
export function resolveStoragePath(): string {
  const fromEnv = process.env.SNAPCOMMIT_STORAGE;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  const cfg = readConfig();
  if (cfg.storagePath && cfg.storagePath.trim()) return cfg.storagePath.trim();
  return join(configDir(), "memories.db");
}

export function hasPro(): boolean {
  const cfg = readConfig();
  return cfg.licenseStatus === "active";
}

export function getApiKey(): { provider: "anthropic" | "openai"; key: string } | null {
  const cfg = readConfig();
  const preferred = cfg.preferredProvider ?? "anthropic";
  if (preferred === "anthropic" && cfg.anthropicApiKey) {
    return { provider: "anthropic", key: cfg.anthropicApiKey };
  }
  if (preferred === "openai" && cfg.openaiApiKey) {
    return { provider: "openai", key: cfg.openaiApiKey };
  }
  // Fallback: whichever is set
  if (cfg.anthropicApiKey) return { provider: "anthropic", key: cfg.anthropicApiKey };
  if (cfg.openaiApiKey) return { provider: "openai", key: cfg.openaiApiKey };
  return null;
}
