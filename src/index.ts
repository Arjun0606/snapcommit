#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MemoryStore } from "./db.js";
import { saveMemory, saveMemorySchema } from "./tools/save.js";
import { recallMemory, recallMemorySchema } from "./tools/recall.js";
import { listProjects } from "./tools/projects.js";
import {
  updateMemory,
  updateMemorySchema,
  deleteMemory,
  deleteMemorySchema,
} from "./tools/update.js";

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
