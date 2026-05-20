/**
 * Snapcommit Pro: smart_extract
 *
 * Sends a conversation chunk to our cloud API, which proxies to an LLM
 * (Anthropic/OpenAI) using our own key, counts the call against the user's
 * monthly quota, and returns structured memories. Content is processed
 * in-flight and never persisted server-side.
 *
 * Free tier: 5 calls/month. Hobby: 200. Pro: 2,000. Studio: 10,000.
 */
import { z } from "zod";
import type { MemoryStore } from "../db.js";
import {
  readConfig,
  writeConfig,
  currentTier,
  nextTier,
  ensureDevice,
  TIER_QUOTAS,
  TIER_PRICES,
} from "../config.js";
import { detectProject } from "../project.js";

/**
 * Auto-upgrade nudge. Returns a short message to append to tool responses
 * when the user is approaching or has exceeded their quota.
 */
function quotaNudge(used: number, quota: number): string | null {
  const pct = used / quota;
  const remaining = quota - used;
  const tier = currentTier();
  const next = nextTier(tier);

  if (pct >= 1) {
    return next
      ? `\n\nYou're out of extractions this month. Upgrade to ${next} ($${TIER_PRICES[next]}/mo, ${TIER_QUOTAS[next]} calls) at https://snapcommit.com/pricing`
      : null;
  }
  if (pct >= 0.95) {
    return next
      ? `\n\n⚠ ${remaining} extractions left this month. Upgrade to ${next} (${TIER_QUOTAS[next]}/mo) at https://snapcommit.com/pricing`
      : null;
  }
  if (pct >= 0.8) {
    return next
      ? `\n\nHeads up: ${remaining} extractions left this month. ${next} tier (${TIER_QUOTAS[next]}/mo, $${TIER_PRICES[next]}) at https://snapcommit.com/pricing if you want headroom.`
      : null;
  }
  return null;
}

const API_BASE = process.env.SNAPCOMMIT_API ?? "https://api.snapcommit.com";

interface ExtractedMemory {
  content: string;
  kind: "decision" | "rejection" | "preference" | "fact" | "open_question";
  tags: string[];
}

interface ExtractResponse {
  memories: ExtractedMemory[];
  usage: { used_this_month: number; monthly_quota: number };
}

interface ExtractError {
  error: string;
  code?: "quota_exceeded" | "unauthorized" | "server_error";
  upgrade_url?: string;
}

async function callCloudExtract(
  token: string,
  content: string,
): Promise<ExtractResponse | ExtractError> {
  try {
    const res = await fetch(`${API_BASE}/v1/extract`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (res.status === 402 || res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { upgrade_url?: string };
      return {
        error: "Monthly quota exceeded",
        code: "quota_exceeded",
        upgrade_url: body.upgrade_url ?? "https://snapcommit.com/pricing",
      };
    }
    if (res.status === 401) {
      return { error: "Invalid or expired token", code: "unauthorized" };
    }
    if (!res.ok) {
      return { error: `API ${res.status}: ${await res.text()}`, code: "server_error" };
    }

    return (await res.json()) as ExtractResponse;
  } catch (e) {
    return { error: (e as Error).message, code: "server_error" };
  }
}

export const smartExtractSchema = {
  content: z
    .string()
    .min(20)
    .describe(
      "Conversation transcript or session summary to extract structured memories from. Paste a recent session, a summary, or notes.",
    ),
  project: z
    .string()
    .optional()
    .describe(
      "Project to tag the extracted memories with. Auto-detected from git remote / CWD if omitted.",
    ),
  dry_run: z
    .boolean()
    .optional()
    .describe("If true, return extracted memories without saving them locally."),
};

export function smartExtract(store: MemoryStore, getAgentName: () => string | null) {
  return async (args: { content: string; project?: string; dry_run?: boolean }) => {
    const cfg = readConfig();
    if (!cfg.apiToken) {
      return {
        content: [
          {
            type: "text" as const,
            text: [
              "Not signed in. smart_extract uses Snapcommit's cloud for AI extraction (we never store your content — it's processed in-flight only).",
              "",
              "Get a free account at https://snapcommit.com/signup (5 extractions/month free), then run snapcommit_login with your token.",
            ].join("\n"),
          },
        ],
        isError: true,
      };
    }

    const result = await callCloudExtract(cfg.apiToken, args.content);

    if ("error" in result) {
      const tips: string[] = [];
      if (result.code === "quota_exceeded") {
        tips.push("");
        tips.push(`You're out of smart-extraction calls for this month.`);
        tips.push(`Upgrade: ${result.upgrade_url}`);
        tips.push(`Free tier: 5/mo. Hobby $9: 200. Pro $29: 2000. Studio $99: 10000.`);
      } else if (result.code === "unauthorized") {
        tips.push("");
        tips.push("Re-run snapcommit_login with a fresh token from https://snapcommit.com/account.");
      }
      return {
        content: [
          { type: "text" as const, text: `Extraction failed: ${result.error}${tips.join("\n")}` },
        ],
        isError: true,
      };
    }

    // Update cached usage
    writeConfig({
      monthlyQuota: result.usage.monthly_quota,
      tierVerifiedAt: new Date().toISOString(),
    });

    if (result.memories.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No memories worth extracting. (${result.usage.used_this_month} / ${result.usage.monthly_quota} used this month.)`,
          },
        ],
      };
    }

    const project = args.project ?? detectProject() ?? undefined;

    const nudge = quotaNudge(result.usage.used_this_month, result.usage.monthly_quota) ?? "";

    if (args.dry_run) {
      const summary = result.memories
        .map(
          (m, i) =>
            `${i + 1}. [${m.kind}] ${m.content}${m.tags.length ? ` (${m.tags.join(", ")})` : ""}`,
        )
        .join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Would extract ${result.memories.length} memories (dry-run):`,
              "",
              summary,
              "",
              `Usage: ${result.usage.used_this_month} / ${result.usage.monthly_quota} this month${nudge}`,
            ].join("\n"),
          },
        ],
      };
    }

    const device = ensureDevice();
    const sourceAgent = getAgentName() ?? undefined;
    const saved = result.memories.map((m) =>
      store.save({
        content: m.content,
        kind: m.kind,
        tags: m.tags,
        project,
        source_agent: sourceAgent,
        source_device: device.label,
      }),
    );

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Saved ${saved.length} memories${project ? ` (project: ${project})` : ""}.`,
            `IDs: ${saved.map((s) => "#" + s.id).join(", ")}`,
            ``,
            `Usage: ${result.usage.used_this_month} / ${result.usage.monthly_quota} smart-extractions this month${nudge}`,
          ].join("\n"),
        },
      ],
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// snapcommit_usage — quick quota check
// ────────────────────────────────────────────────────────────────────────────

export function usage() {
  return async () => {
    const cfg = readConfig();
    if (!cfg.apiToken) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Not signed in. Free tier: 5 smart-extractions/month. Sign up at https://snapcommit.com/signup",
          },
        ],
      };
    }
    // Light call: hit /v1/account to get fresh usage
    try {
      const res = await fetch(`${API_BASE}/v1/account`, {
        headers: { authorization: `Bearer ${cfg.apiToken}` },
      });
      if (!res.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Tier (cached): ${cfg.tier ?? "free"}\nQuota (cached): ${cfg.monthlyQuota ?? 5}\nLive check failed (${res.status}).`,
            },
          ],
        };
      }
      const acct = (await res.json()) as {
        tier: string;
        monthly_quota: number;
        used_this_month: number;
      };
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Tier: ${acct.tier}`,
              `Used: ${acct.used_this_month} / ${acct.monthly_quota} smart-extractions`,
              `Remaining: ${acct.monthly_quota - acct.used_this_month}`,
            ].join("\n"),
          },
        ],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Couldn't reach Snapcommit cloud (${(e as Error).message}). Cached tier: ${cfg.tier ?? "free"}.`,
          },
        ],
      };
    }
  };
}
