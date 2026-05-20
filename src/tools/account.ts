/**
 * Account + subscription management.
 *
 * Flow:
 *   1. User signs up at snapcommit.com (Dodo Payments handles billing + tax)
 *   2. They receive an API token via email
 *   3. snapcommit_login token=... stores it locally
 *   4. We verify with our cloud, cache tier + quota
 *   5. Pro features call our cloud API authenticated with this token
 *
 * Cloud is the source of truth for tier. We cache locally for offline display.
 */
import { z } from "zod";
import { readConfig, writeConfig, TIER_QUOTAS, type Tier } from "../config.js";

const API_BASE = process.env.SNAPCOMMIT_API ?? "https://api.snapcommit.com";

interface AccountInfo {
  tier: Tier;
  monthly_quota: number;
  used_this_month: number;
  email?: string;
}

async function fetchAccount(token: string): Promise<AccountInfo | { error: string }> {
  try {
    const res = await fetch(`${API_BASE}/v1/account`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) return { error: "Invalid or expired token" };
      return { error: `Account check failed (${res.status})` };
    }
    return (await res.json()) as AccountInfo;
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_login
// ────────────────────────────────────────────────────────────────────────────

export const loginSchema = {
  token: z
    .string()
    .min(16)
    .describe(
      "Your Snapcommit API token, sent by email after signup at https://snapcommit.com/signup",
    ),
};

export function login() {
  return async (args: { token: string }) => {
    const info = await fetchAccount(args.token);

    if ("error" in info) {
      // Allow saving even when offline so the user can try again later
      writeConfig({
        apiToken: args.token,
        tier: "free",
        monthlyQuota: TIER_QUOTAS.free,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Token saved locally, but couldn't verify with the server (${info.error}). Free-tier limits will apply until verification succeeds. Try snapcommit_account_status when you're online.`,
          },
        ],
      };
    }

    writeConfig({
      apiToken: args.token,
      tier: info.tier,
      monthlyQuota: info.monthly_quota,
      tierVerifiedAt: new Date().toISOString(),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Signed in${info.email ? ` as ${info.email}` : ""}.`,
            `Tier: ${info.tier}`,
            `Monthly quota: ${info.monthly_quota} smart-extraction calls`,
            `Used so far: ${info.used_this_month}`,
            ``,
            info.tier === "free"
              ? `Upgrade at https://snapcommit.com/pricing for higher limits.`
              : `Manage your subscription at https://snapcommit.com/account.`,
          ].join("\n"),
        },
      ],
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_account_status
// ────────────────────────────────────────────────────────────────────────────

export function accountStatus() {
  return async () => {
    const cfg = readConfig();
    if (!cfg.apiToken) {
      return {
        content: [
          {
            type: "text" as const,
            text: [
              "Not signed in. You're on the Free tier with 5 smart-extraction calls / month and full local memory features.",
              "",
              "Sign up at https://snapcommit.com/signup, then run snapcommit_login with your token.",
            ].join("\n"),
          },
        ],
      };
    }

    const info = await fetchAccount(cfg.apiToken);
    if ("error" in info) {
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Couldn't reach Snapcommit cloud (${info.error}).`,
              `Cached tier: ${cfg.tier ?? "free"}`,
              `Cached quota: ${cfg.monthlyQuota ?? TIER_QUOTAS.free} / month`,
              `Last verified: ${cfg.tierVerifiedAt ?? "never"}`,
            ].join("\n"),
          },
        ],
        isError: false,
      };
    }

    // Refresh cache
    writeConfig({
      tier: info.tier,
      monthlyQuota: info.monthly_quota,
      tierVerifiedAt: new Date().toISOString(),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Signed in${info.email ? ` as ${info.email}` : ""}`,
            `Tier: ${info.tier}`,
            `Quota: ${info.used_this_month} / ${info.monthly_quota} smart-extractions this month`,
            `Remaining: ${info.monthly_quota - info.used_this_month}`,
            ``,
            info.tier !== "studio"
              ? `Upgrade at https://snapcommit.com/pricing`
              : `Top tier — thank you for the support.`,
          ].join("\n"),
        },
      ],
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_logout
// ────────────────────────────────────────────────────────────────────────────

export function logout() {
  return async () => {
    writeConfig({
      apiToken: undefined,
      tier: undefined,
      monthlyQuota: undefined,
      tierVerifiedAt: undefined,
    });
    return {
      content: [
        {
          type: "text" as const,
          text: "Signed out. Local memories remain on disk untouched. Free tier active.",
        },
      ],
    };
  };
}
