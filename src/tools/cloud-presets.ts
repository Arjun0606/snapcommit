/**
 * Plug-and-play storage preset tools. One call points snapcommit at a
 * cloud-synced folder; the user's existing provider handles sync + share.
 *
 * We resolve the conventional location on each OS, create the parent
 * directory if it exists (we DON'T create the cloud folder itself — if iCloud
 * Drive doesn't exist on this machine, we won't fake it), then set the path.
 */
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { writeConfig } from "../config.js";

interface PresetResult {
  resolved: string | null;
  hint: string;
}

function icloud(): PresetResult {
  const home = homedir();
  if (platform() === "darwin") {
    const path = join(home, "Library/CloudStorage/iCloud Drive/snapcommit/memories.db");
    const parent = join(home, "Library/CloudStorage/iCloud Drive");
    if (existsSync(parent)) return { resolved: path, hint: "iCloud Drive detected" };
    // Older iCloud path
    const legacy = join(home, "Library/Mobile Documents/com~apple~CloudDocs/snapcommit/memories.db");
    const legacyParent = join(home, "Library/Mobile Documents/com~apple~CloudDocs");
    if (existsSync(legacyParent)) return { resolved: legacy, hint: "iCloud Drive (legacy path)" };
    return { resolved: null, hint: "iCloud Drive not found — sign in via System Settings → Apple ID → iCloud → Drive" };
  }
  return { resolved: null, hint: "iCloud Drive is macOS/iOS only. Try Dropbox or OneDrive on this OS." };
}

function dropbox(): PresetResult {
  const home = homedir();
  const candidates = [
    join(home, "Dropbox"),
    join(home, "Library/CloudStorage/Dropbox"),
  ];
  for (const parent of candidates) {
    if (existsSync(parent)) {
      return {
        resolved: join(parent, "snapcommit/memories.db"),
        hint: `Dropbox detected at ${parent}`,
      };
    }
  }
  return { resolved: null, hint: "Dropbox not detected. Install Dropbox and sign in, then retry." };
}

function onedrive(): PresetResult {
  const home = homedir();
  const candidates = [
    join(home, "OneDrive"),
    join(home, "Library/CloudStorage/OneDrive"),
    process.env.USERPROFILE ? join(process.env.USERPROFILE, "OneDrive") : null,
  ].filter(Boolean) as string[];
  for (const parent of candidates) {
    if (existsSync(parent)) {
      return {
        resolved: join(parent, "snapcommit/memories.db"),
        hint: `OneDrive detected at ${parent}`,
      };
    }
  }
  return { resolved: null, hint: "OneDrive not detected." };
}

function gdrive(): PresetResult {
  const home = homedir();
  const candidates = [
    join(home, "Library/CloudStorage/GoogleDrive-personal"),
    join(home, "Google Drive"),
  ];
  for (const parent of candidates) {
    if (existsSync(parent)) {
      return {
        resolved: join(parent, "snapcommit/memories.db"),
        hint: `Google Drive detected at ${parent}`,
      };
    }
  }
  return { resolved: null, hint: "Google Drive (desktop client) not detected." };
}

function applyPreset(result: PresetResult, name: string) {
  if (!result.resolved) {
    return {
      content: [{ type: "text" as const, text: `${name}: ${result.hint}` }],
      isError: true,
    };
  }
  writeConfig({ storagePath: result.resolved });
  return {
    content: [
      {
        type: "text" as const,
        text: [
          `Storage now points at ${result.resolved}`,
          result.hint,
          ``,
          `What happens next:`,
          `  • Restart your AI client so it picks up the new path.`,
          `  • If a memories.db already exists, ${name} will start syncing it across devices.`,
          `  • On other devices, run the same preset to sync there too.`,
          `  • To share with a teammate, share the snapcommit/ folder via ${name}'s normal sharing.`,
        ].join("\n"),
      },
    ],
  };
}

export function useIcloud() {
  return async () => applyPreset(icloud(), "iCloud Drive");
}
export function useDropbox() {
  return async () => applyPreset(dropbox(), "Dropbox");
}
export function useOneDrive() {
  return async () => applyPreset(onedrive(), "OneDrive");
}
export function useGoogleDrive() {
  return async () => applyPreset(gdrive(), "Google Drive");
}
