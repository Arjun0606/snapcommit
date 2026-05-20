import { z } from "zod";
import { existsSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, isAbsolute, dirname } from "node:path";
import { resolveStoragePath, writeConfig, readConfig } from "../config.js";

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_storage_info — show current state + suggestions
// ────────────────────────────────────────────────────────────────────────────

function suggestions(): string[] {
  const home = homedir();
  const sug: string[] = [];

  if (platform() === "darwin") {
    sug.push(`iCloud Drive: ${join(home, "Library/CloudStorage/iCloud Drive/snapcommit/memories.db")}`);
    const possibleDropbox = join(home, "Library/CloudStorage");
    if (existsSync(possibleDropbox)) {
      sug.push(`Dropbox / OneDrive / Google Drive: check ${possibleDropbox} for your provider, then point at <provider>/snapcommit/memories.db`);
    }
  } else if (platform() === "win32") {
    sug.push(`OneDrive: ${join(process.env.USERPROFILE ?? home, "OneDrive/snapcommit/memories.db")}`);
    sug.push(`Dropbox: ${join(process.env.USERPROFILE ?? home, "Dropbox/snapcommit/memories.db")}`);
  } else {
    sug.push(`Dropbox: ${join(home, "Dropbox/snapcommit/memories.db")}`);
    sug.push(`Syncthing: ${join(home, "Sync/snapcommit/memories.db")}`);
  }

  return sug;
}

export function storageInfo() {
  return async () => {
    const current = resolveStoragePath();
    const exists = existsSync(current);
    const size = exists ? statSync(current).size : 0;

    const lines = [
      `Storage path: ${current}`,
      `Exists: ${exists ? "yes" : "no"} (${size} bytes)`,
      ``,
      `To sync across devices, move the file to a cloud-synced folder. Examples:`,
      ...suggestions().map((s) => `  - ${s}`),
      ``,
      `To switch storage path, call snapcommit_set_storage_path with the new path.`,
      `For team sharing, point all teammates' snapcommit at the same shared cloud folder.`,
    ];

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_set_storage_path
// ────────────────────────────────────────────────────────────────────────────

export const setStoragePathSchema = {
  path: z.string().describe("Absolute path where memories.db should live. Examples: ~/Library/CloudStorage/iCloud Drive/snapcommit/memories.db (Mac), ~/Dropbox/snapcommit/memories.db (any). Parent directory will be created if needed."),
};

function expandHome(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return join(homedir(), p.slice(2));
  }
  return p;
}

export function setStoragePath() {
  return async (args: { path: string }) => {
    const expanded = expandHome(args.path);
    if (!isAbsolute(expanded)) {
      return {
        content: [{ type: "text" as const, text: `Path must be absolute or start with ~/. Got: ${args.path}` }],
        isError: true,
      };
    }

    const parent = dirname(expanded);
    if (!existsSync(parent)) {
      return {
        content: [{
          type: "text" as const,
          text: `Parent directory does not exist: ${parent}\n\nCreate it first, or pick a path inside a folder that exists (e.g., your iCloud Drive or Dropbox).`,
        }],
        isError: true,
      };
    }

    writeConfig({ storagePath: expanded });

    return {
      content: [{
        type: "text" as const,
        text: `Storage path set to: ${expanded}\n\nRestart your MCP client to use the new path. If you're migrating from a previous path, move your existing memories.db file to the new location first.`,
      }],
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_status — overall state of the world for the user
// ────────────────────────────────────────────────────────────────────────────

export function status() {
  return async () => {
    const cfg = readConfig();
    const path = resolveStoragePath();
    const exists = existsSync(path);

    const lines = [
      `Snapcommit status`,
      `─────────────────`,
      `Storage: ${path} ${exists ? "(exists)" : "(not yet created)"}`,
      `Signed in: ${cfg.apiToken ? "yes" : "no"}`,
      `Tier: ${cfg.tier ?? "free"}`,
      `Monthly extraction quota: ${cfg.monthlyQuota ?? 5}`,
    ];

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  };
}
