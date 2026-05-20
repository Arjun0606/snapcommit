import { z } from "zod";
import type { MemoryStore } from "../db.js";
import {
  readConfig,
  writeConfig,
  isConnected,
  verifyToken,
  parsePageId,
  createMemoryDatabase,
  upsertMemory,
  pullAll,
} from "../notion.js";

// ────────────────────────────────────────────────────────────────────────────
// notion_setup
// ────────────────────────────────────────────────────────────────────────────

export const notionSetupSchema = {
  token: z
    .string()
    .min(20)
    .describe(
      "Notion internal-integration token (starts with 'secret_' or 'ntn_'). Get one at https://www.notion.so/profile/integrations — create a new internal integration, copy the secret.",
    ),
  parent_page: z
    .string()
    .describe(
      "URL or ID of a Notion page you've shared with the integration. We create the 'Snapcommit Memory' database inside this page.",
    ),
};

export function notionSetup() {
  return async (args: { token: string; parent_page: string }) => {
    const verification = await verifyToken(args.token);
    if (!verification.ok) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Token rejected by Notion: ${verification.error}\n\nMake sure you:\n1. Created an internal integration at https://www.notion.so/profile/integrations\n2. Copied the secret token (starts with 'secret_' or 'ntn_')\n3. Shared at least one page with the integration`,
          },
        ],
        isError: true,
      };
    }

    const pageId = parsePageId(args.parent_page);
    if (!pageId) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Could not parse a Notion page ID from: ${args.parent_page}\n\nExpected a Notion page URL like https://www.notion.so/Memory-abcdef... or a raw 32-char ID.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const db = await createMemoryDatabase(args.token, pageId);
      writeConfig({
        token: args.token,
        databaseId: db.id,
        databaseUrl: db.url,
        workspaceName: verification.workspaceName,
        connectedAt: new Date().toISOString(),
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Connected to ${verification.workspaceName}.\n\nCreated database: ${db.url}\n\nNext: call snapcommit_notion_sync to push your local memories.`,
          },
        ],
      };
    } catch (e) {
      const msg = (e as Error).message;
      const hint = msg.includes("not_found") || msg.includes("403")
        ? "\n\nLikely cause: the parent page hasn't been shared with your integration. Open the page in Notion → ... menu → Add connections → pick your integration."
        : "";
      return {
        content: [
          {
            type: "text" as const,
            text: `Notion database creation failed: ${msg}${hint}`,
          },
        ],
        isError: true,
      };
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────
// notion_sync — push local → Notion
// ────────────────────────────────────────────────────────────────────────────

export const notionSyncSchema = {
  project: z.string().optional().describe("Only sync memories in this project. Omit to sync all."),
  limit: z.number().int().positive().max(500).optional().describe("Cap on memories per call (default: all)."),
};

export function notionSync(store: MemoryStore) {
  return async (args: { project?: string; limit?: number }) => {
    const cfg = readConfig();
    if (!cfg) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Not connected to Notion. Run snapcommit_notion_setup first.",
          },
        ],
        isError: true,
      };
    }

    const memories = store.recent(args.project, args.limit ?? 10000);
    if (memories.length === 0) {
      return {
        content: [
          { type: "text" as const, text: "No memories to sync." },
        ],
      };
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const m of memories) {
      try {
        const r = await upsertMemory(cfg.token, cfg.databaseId, m);
        if (r.created) created++;
        else updated++;
      } catch (e) {
        errors.push(`#${m.id}: ${(e as Error).message}`);
      }
    }

    const lines = [
      `Synced ${memories.length} memories to Notion.`,
      `Created: ${created}, Updated: ${updated}${errors.length ? `, Errors: ${errors.length}` : ""}`,
      cfg.databaseUrl ? `\nView in Notion: ${cfg.databaseUrl}` : "",
    ].filter(Boolean);

    if (errors.length) {
      lines.push("", "Errors (first 5):", ...errors.slice(0, 5));
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// notion_status
// ────────────────────────────────────────────────────────────────────────────

export function notionStatus() {
  return async () => {
    const cfg = readConfig();
    if (!cfg) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Notion sync is NOT configured.\n\nSnapcommit is working in local-only mode. Your memories live in ~/.snapcommit-mcp/memories.db.\n\nTo enable Notion sync, run snapcommit_notion_setup with a Notion integration token and a parent page URL.",
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Notion sync is configured.`,
            `Workspace: ${cfg.workspaceName ?? "(unknown)"}`,
            `Database: ${cfg.databaseUrl ?? cfg.databaseId}`,
            `Connected: ${cfg.connectedAt}`,
            ``,
            `Tip: call snapcommit_notion_sync to push recent local memories to Notion.`,
          ].join("\n"),
        },
      ],
    };
  };
}

// ────────────────────────────────────────────────────────────────────────────
// notion_pull — fetch Notion → report local diff (does not auto-merge in v1)
// ────────────────────────────────────────────────────────────────────────────

export function notionPull(store: MemoryStore) {
  return async () => {
    const cfg = readConfig();
    if (!cfg) {
      return {
        content: [
          { type: "text" as const, text: "Not connected to Notion. Run snapcommit_notion_setup first." },
        ],
        isError: true,
      };
    }

    let rows;
    try {
      rows = await pullAll(cfg.token, cfg.databaseId);
    } catch (e) {
      return {
        content: [
          { type: "text" as const, text: `Pull failed: ${(e as Error).message}` },
        ],
        isError: true,
      };
    }

    const localCount = store.count();
    const notionCount = rows.length;
    const inNotionNotLocal = rows.filter(
      (r) => r.externalId === null || !store.byId(r.externalId),
    ).length;

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `Notion: ${notionCount} memories`,
            `Local: ${localCount} memories`,
            `In Notion but not local: ${inNotionNotLocal}`,
            ``,
            `v1 note: pull is read-only inspection. Edits made in Notion are not yet merged back to local SQLite — that's v2. For now, treat local as source of truth and Notion as your shareable mirror.`,
          ].join("\n"),
        },
      ],
    };
  };
}
