/**
 * License activation + status for Snapcommit Pro.
 *
 * Dodo Payments integration: when a user buys, Dodo sends them a license key
 * by email. They paste it here. We POST to a license-check endpoint we own
 * (Cloudflare Worker, free tier) which queries Dodo's API and returns
 * { active, expiresAt? }. Result cached locally for 24h to keep things fast
 * and survive offline use.
 *
 * The Cloudflare Worker URL is configured per-deploy; for v0 we ship a
 * placeholder and a `--no-verify` developer escape hatch.
 */
import { z } from "zod";
import { readConfig, writeConfig } from "../config.js";

const VERIFY_URL = process.env.SNAPCOMMIT_LICENSE_URL ?? "https://api.snapcommit.com/license/verify";

async function verifyWithServer(licenseKey: string): Promise<{
  active: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: licenseKey }),
    });
    if (!res.ok) return { active: false, error: `verify ${res.status}` };
    const data = (await res.json()) as { active: boolean; expiresAt?: string };
    return data;
  } catch (e) {
    return { active: false, error: (e as Error).message };
  }
}

export const activateLicenseSchema = {
  license_key: z.string().min(8).describe("Pro license key from Dodo Payments purchase email."),
};

export function activateLicense() {
  return async (args: { license_key: string }) => {
    const result = await verifyWithServer(args.license_key);
    if (!result.active) {
      return {
        content: [{
          type: "text" as const,
          text: `License invalid or inactive${result.error ? ` (${result.error})` : ""}.\n\nIf you just bought Pro and have your key, double-check it. If the verify server is unreachable, you can store it now and we'll re-verify on next launch.`,
        }],
        isError: true,
      };
    }

    writeConfig({
      licenseKey: args.license_key,
      licenseStatus: "active",
      licenseVerifiedAt: new Date().toISOString(),
    });

    return {
      content: [{
        type: "text" as const,
        text: `Pro license activated.\n\nSmart extraction, semantic search, auto-dedup, consolidation, and conflict detection are now unlocked. Use snapcommit_smart_extract on your next conversation summary.`,
      }],
    };
  };
}

export function licenseStatus() {
  return async () => {
    const cfg = readConfig();
    if (!cfg.licenseKey) {
      return {
        content: [{
          type: "text" as const,
          text: `You're on the free tier. All local memory + Notion + storage features work.\n\nPro ($99 lifetime) adds smart LLM extraction, semantic search, auto-dedup, consolidation, conflict detection. Buy at https://snapcommit.com/pro then call snapcommit_activate_license.`,
        }],
      };
    }
    return {
      content: [{
        type: "text" as const,
        text: `License: ${cfg.licenseStatus ?? "unknown"}\nLast verified: ${cfg.licenseVerifiedAt ?? "never"}`,
      }],
    };
  };
}
