#!/usr/bin/env node
/**
 * snapcommit-install — detect MCP-capable AI clients on this machine and write
 * the snapcommit server config into each one. Idempotent: re-running is safe.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

type Client = {
  name: string;
  configPath: string;
  key?: string; // top-level key in the JSON for MCP servers (default: mcpServers)
};

function clients(): Client[] {
  const home = homedir();
  const list: Client[] = [];

  if (platform() === "darwin") {
    list.push({
      name: "Claude Desktop",
      configPath: join(home, "Library/Application Support/Claude/claude_desktop_config.json"),
    });
  } else if (platform() === "win32") {
    list.push({
      name: "Claude Desktop",
      configPath: join(process.env.APPDATA ?? "", "Claude/claude_desktop_config.json"),
    });
  }

  list.push({
    name: "Cursor",
    configPath: join(home, ".cursor/mcp.json"),
  });

  list.push({
    name: "Claude Code",
    configPath: join(home, ".claude.json"),
  });

  list.push({
    name: "Windsurf",
    configPath: join(home, ".codeium/windsurf/mcp_config.json"),
  });

  list.push({
    name: "Cline",
    configPath: join(home, "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"),
  });

  return list;
}

function configBlock() {
  return {
    command: "npx",
    args: ["-y", "@snapcommit/mcp"],
  };
}

function patchConfig(path: string): { ok: boolean; reason: string } {
  let json: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      json = JSON.parse(readFileSync(path, "utf-8"));
    } catch (e) {
      return { ok: false, reason: `existing config invalid JSON: ${(e as Error).message}` };
    }
  } else {
    mkdirSync(dirname(path), { recursive: true });
  }

  const servers = (json.mcpServers as Record<string, unknown> | undefined) ?? {};
  servers.snapcommit = configBlock();
  json.mcpServers = servers;

  writeFileSync(path, JSON.stringify(json, null, 2));
  return { ok: true, reason: "installed" };
}

function main() {
  console.log("\n  Snapcommit installer");
  console.log("  ────────────────────\n");

  let installed = 0;
  let skipped = 0;

  for (const c of clients()) {
    const exists = existsSync(c.configPath);
    if (!exists) {
      console.log(`  ·  ${c.name.padEnd(18)}  not detected`);
      skipped++;
      continue;
    }
    const r = patchConfig(c.configPath);
    if (r.ok) {
      console.log(`  ✓  ${c.name.padEnd(18)}  ${c.configPath}`);
      installed++;
    } else {
      console.log(`  ✗  ${c.name.padEnd(18)}  ${r.reason}`);
      skipped++;
    }
  }

  console.log(`\n  Installed into ${installed} client(s). Skipped ${skipped}.`);
  console.log("\n  Restart your AI clients to pick up the new MCP server.");
  console.log("  Your memories will live at ~/.snapcommit-mcp/memories.db\n");
}

main();
