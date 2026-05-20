#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MemoryStore } from "./db.js";
import { saveMemory, saveMemorySchema } from "./tools/save.js";
import { recallMemory, recallMemorySchema } from "./tools/recall.js";
import { listProjects } from "./tools/projects.js";
import { listMemories, listMemoriesSchema } from "./tools/list.js";
import { exportMemories, exportMemoriesSchema } from "./tools/export.js";
import {
  updateMemory,
  updateMemorySchema,
  deleteMemory,
  deleteMemorySchema,
} from "./tools/update.js";
import {
  notionSetup,
  notionSetupSchema,
  notionSync,
  notionSyncSchema,
  notionStatus,
  notionPull,
} from "./tools/notion.js";
import {
  storageInfo,
  setStoragePath,
  setStoragePathSchema,
  setApiKey,
  setApiKeySchema,
  status,
} from "./tools/storage.js";
import { smartExtract, smartExtractSchema } from "./tools/extract.js";
import {
  activateLicense,
  activateLicenseSchema,
  licenseStatus,
} from "./tools/license.js";

async function main(): Promise<void> {
  const store = new MemoryStore();

  const server = new McpServer({
    name: "snapcommit",
    version: "0.1.0",
  });

  server.tool(
    "save_memory",
    "Save a memory from this conversation. Use for decisions, things you tried and rejected (with reason), preferences, facts about the codebase, or open questions. Call this proactively when something is worth remembering for future sessions.",
    saveMemorySchema,
    saveMemory(store),
  );

  server.tool(
    "recall_memory",
    "Search saved memories. Call this at the start of a session or whenever you need context about past decisions, prior attempts, or known preferences. Returns top matches by relevance.",
    recallMemorySchema,
    recallMemory(store),
  );

  server.tool(
    "list_projects",
    "List all projects with memory counts. Use this to orient yourself when starting work.",
    {},
    listProjects(store),
  );

  server.tool(
    "list_memories",
    "Browse memories without searching. Returns the most recent memories, optionally filtered by project or kind. Use when you want to see what's been remembered rather than search for something specific.",
    listMemoriesSchema,
    listMemories(store),
  );

  server.tool(
    "export_memories",
    "Export memories as Markdown or JSON. Useful when the user wants to back up, share, or paste their memory into another system. Always offer this — data portability is a core trust signal.",
    exportMemoriesSchema,
    exportMemories(store),
  );

  server.tool(
    "update_memory",
    "Update an existing memory by id. Only provide fields you want to change.",
    updateMemorySchema,
    updateMemory(store),
  );

  server.tool(
    "delete_memory",
    "Delete a memory by id. Use sparingly — only when the memory is clearly wrong or obsolete.",
    deleteMemorySchema,
    deleteMemory(store),
  );

  // ──────────────────────────────────────────────────────────────────────
  // Storage + config — primary way to set up sync across devices and teams
  // ──────────────────────────────────────────────────────────────────────

  server.tool(
    "snapcommit_storage_info",
    "Show where Snapcommit's memory file lives and how to sync it across devices or share with a team. Suggests cloud-folder paths (iCloud, Dropbox, OneDrive, etc.) for the user's OS.",
    {},
    storageInfo(),
  );

  server.tool(
    "snapcommit_set_storage_path",
    "Move Snapcommit's memory file to a new path — e.g., a cloud-synced folder like iCloud Drive or Dropbox. To sync across the user's own devices, point at a folder their cloud provider syncs. To share with a team, point at a shared cloud folder. We never sync the file ourselves.",
    setStoragePathSchema,
    setStoragePath(),
  );

  server.tool(
    "snapcommit_set_api_key",
    "Store the user's own Anthropic or OpenAI API key locally for Pro features (BYOK — Bring Your Own Key). The key never leaves their machine.",
    setApiKeySchema,
    setApiKey(),
  );

  server.tool(
    "snapcommit_status",
    "Show overall Snapcommit state: storage path, license tier, API key status, preferred provider.",
    {},
    status(),
  );

  // ──────────────────────────────────────────────────────────────────────
  // Pro: smart_extract (BYOK)
  // ──────────────────────────────────────────────────────────────────────

  server.tool(
    "snapcommit_smart_extract",
    "Pro feature: extract structured memories (decisions, rejections, preferences, facts, open questions) from a conversation summary using the user's own LLM API key. Higher quality than the free tier's keyword-based capture. Requires Pro license + a configured API key.",
    smartExtractSchema,
    smartExtract(store),
  );

  // ──────────────────────────────────────────────────────────────────────
  // License management (Dodo Payments)
  // ──────────────────────────────────────────────────────────────────────

  server.tool(
    "snapcommit_activate_license",
    "Activate a Snapcommit Pro license. Verify a key purchased via Dodo Payments and unlock Pro features. The key is stored locally; verification happens online once and is cached.",
    activateLicenseSchema,
    activateLicense(),
  );

  server.tool(
    "snapcommit_license_status",
    "Show current license tier and last verification timestamp.",
    {},
    licenseStatus(),
  );

  // ──────────────────────────────────────────────────────────────────────
  // Notion sync — optional adapter. The user's Notion is one of many places
  // the storage file CAN live; this tool is for users who want a Notion DB
  // mirror in addition to (or instead of) plain file storage.
  // ──────────────────────────────────────────────────────────────────────

  server.tool(
    "snapcommit_notion_setup",
    "Connect Snapcommit to the user's Notion workspace. Creates a 'Snapcommit Memory' database in a parent page they choose. The user needs: (1) an internal Notion integration token from https://www.notion.so/profile/integrations, and (2) a parent page they've shared with that integration. Their token never leaves their machine.",
    notionSetupSchema,
    notionSetup(),
  );

  server.tool(
    "snapcommit_notion_sync",
    "Push local memories to the user's connected Notion database. Idempotent — re-running updates existing rows instead of duplicating. Call this when the user wants to back up, share, or access memories from another device via Notion.",
    notionSyncSchema,
    notionSync(store),
  );

  server.tool(
    "snapcommit_notion_status",
    "Check if Notion sync is configured, and report workspace + database URL if so. Use this when the user asks about backup, sharing, or cross-device access.",
    {},
    notionStatus(),
  );

  server.tool(
    "snapcommit_notion_pull",
    "Inspect the user's Notion database and report counts vs local SQLite. Read-only in v1; does not merge Notion edits back into local. Useful for verifying sync state.",
    {},
    notionPull(store),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", () => {
    store.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("snapcommit-mcp failed:", err);
  process.exit(1);
});
