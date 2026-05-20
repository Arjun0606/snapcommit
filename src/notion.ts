/**
 * Notion sync — optional. We are not a database. The user's Notion workspace is.
 *
 * Architecture:
 *  - User creates an internal integration in their own Notion workspace
 *  - User shares ONE parent page with that integration
 *  - We create a "Snapcommit Memory" database inside that parent page
 *  - We push local memories to Notion as rows (idempotent via external_id)
 *  - We pull edits back from Notion on demand
 *
 * Config (token + databaseId) lives in ~/.snapcommit-mcp/notion.json with chmod 600.
 * If no config, sync is a no-op — local SQLite still works perfectly.
 */
import { Client } from "@notionhq/client";
import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import type { Memory } from "./db.js";

const KIND_COLORS = {
  decision: "green",
  rejection: "red",
  preference: "blue",
  fact: "default",
  open_question: "yellow",
} as const;

export interface NotionConfig {
  token: string;
  databaseId: string;
  databaseUrl?: string;
  connectedAt: string;
  workspaceName?: string;
}

function configPath(): string {
  return join(homedir(), ".snapcommit-mcp", "notion.json");
}

export function readConfig(): NotionConfig | null {
  const path = configPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as NotionConfig;
  } catch {
    return null;
  }
}

export function writeConfig(cfg: NotionConfig): void {
  const path = configPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cfg, null, 2));
  try {
    chmodSync(path, 0o600);
  } catch {
    // ignore on systems that don't support chmod
  }
}

export function isConnected(): boolean {
  return readConfig() !== null;
}

function clientFor(token: string): Client {
  return new Client({ auth: token });
}

export async function verifyToken(token: string): Promise<{
  ok: boolean;
  workspaceName?: string;
  error?: string;
}> {
  try {
    const c = clientFor(token);
    const me = (await c.users.me({})) as { name?: string; bot?: { workspace_name?: string } };
    return {
      ok: true,
      workspaceName: me.bot?.workspace_name ?? me.name ?? "Notion workspace",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Parse a Notion page URL or ID into a clean page ID.
 * Accepts: https://www.notion.so/Some-Title-abcdef1234567890abcdef1234567890
 *          https://www.notion.so/workspace/abcdef1234567890abcdef1234567890
 *          abcdef12-3456-7890-abcd-ef1234567890
 *          abcdef1234567890abcdef1234567890
 */
export function parsePageId(input: string): string | null {
  const cleaned = input.trim();
  // Strip URL fragments and query
  const noQuery = cleaned.split(/[?#]/)[0];
  // Extract last segment after / or -
  const last = noQuery.split("/").pop() ?? noQuery;
  // Look for a 32-char hex sequence (with or without dashes)
  const match = last.match(/([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})/i);
  if (!match) return null;
  const stripped = match[1].replace(/-/g, "");
  if (stripped.length !== 32) return null;
  return `${stripped.slice(0, 8)}-${stripped.slice(8, 12)}-${stripped.slice(12, 16)}-${stripped.slice(16, 20)}-${stripped.slice(20)}`;
}

export async function createMemoryDatabase(
  token: string,
  parentPageId: string,
): Promise<{ id: string; url: string }> {
  const c = clientFor(token);
  const db = await c.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "Snapcommit Memory" } }],
    properties: {
      Title: { title: {} },
      Project: { select: { options: [] } },
      Kind: {
        select: {
          options: [
            { name: "decision", color: KIND_COLORS.decision },
            { name: "rejection", color: KIND_COLORS.rejection },
            { name: "preference", color: KIND_COLORS.preference },
            { name: "fact", color: KIND_COLORS.fact },
            { name: "open_question", color: KIND_COLORS.open_question },
          ],
        },
      },
      Tags: { multi_select: { options: [] } },
      "External ID": { number: {} },
      Created: { date: {} },
      Updated: { date: {} },
    },
  });
  return { id: db.id, url: (db as { url?: string }).url ?? "" };
}

function memoryToPageProps(m: Memory) {
  const tags = (JSON.parse(m.tags) as string[]).map((t) => ({ name: t }));
  const title = m.content.length > 80 ? m.content.slice(0, 77) + "..." : m.content;
  return {
    Title: { title: [{ type: "text" as const, text: { content: title } }] },
    Project: m.project ? { select: { name: m.project } } : { select: null },
    Kind: { select: { name: m.kind } },
    Tags: { multi_select: tags },
    "External ID": { number: m.id },
    Created: { date: { start: m.created_at.replace(" ", "T") + "Z" } },
    Updated: { date: { start: m.updated_at.replace(" ", "T") + "Z" } },
  };
}

function memoryBodyBlocks(m: Memory) {
  // Notion paragraphs cap at 2000 chars per rich text — chunk content if needed
  const chunks: string[] = [];
  for (let i = 0; i < m.content.length; i += 1800) {
    chunks.push(m.content.slice(i, i + 1800));
  }
  return chunks.map((chunk) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [{ type: "text" as const, text: { content: chunk } }],
    },
  }));
}

async function findPageByExternalId(
  c: Client,
  databaseId: string,
  externalId: number,
): Promise<string | null> {
  const result = (await c.databases.query({
    database_id: databaseId,
    filter: {
      property: "External ID",
      number: { equals: externalId },
    },
    page_size: 1,
  })) as { results: { id: string }[] };
  return result.results[0]?.id ?? null;
}

export async function upsertMemory(
  token: string,
  databaseId: string,
  m: Memory,
): Promise<{ id: string; created: boolean }> {
  const c = clientFor(token);
  const existing = await findPageByExternalId(c, databaseId, m.id);

  if (existing) {
    await c.pages.update({
      page_id: existing,
      properties: memoryToPageProps(m),
    });
    // body block update is more involved; for now we leave existing blocks alone
    return { id: existing, created: false };
  }

  const page = await c.pages.create({
    parent: { type: "database_id", database_id: databaseId },
    properties: memoryToPageProps(m),
    children: memoryBodyBlocks(m),
  });
  return { id: page.id, created: true };
}

export interface PullRow {
  externalId: number | null;
  notionPageId: string;
  content: string;
  project: string | null;
  kind: Memory["kind"];
  tags: string[];
  updatedAt: string;
}

export async function pullAll(
  token: string,
  databaseId: string,
): Promise<PullRow[]> {
  const c = clientFor(token);
  const rows: PullRow[] = [];
  let cursor: string | undefined;

  do {
    const r = (await c.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    })) as {
      results: Array<{
        id: string;
        last_edited_time: string;
        properties: Record<string, unknown>;
      }>;
      has_more: boolean;
      next_cursor: string | null;
    };

    for (const page of r.results) {
      const props = page.properties as {
        "External ID"?: { number: number | null };
        Project?: { select: { name: string } | null };
        Kind?: { select: { name: string } | null };
        Tags?: { multi_select: Array<{ name: string }> };
        Title?: { title: Array<{ plain_text: string }> };
      };
      const titleText = props.Title?.title?.map((t) => t.plain_text).join("") ?? "";
      // For now use title as content surrogate — full body fetch would require another API call per page
      rows.push({
        externalId: props["External ID"]?.number ?? null,
        notionPageId: page.id,
        content: titleText,
        project: props.Project?.select?.name ?? null,
        kind: ((props.Kind?.select?.name as Memory["kind"]) ?? "fact"),
        tags: (props.Tags?.multi_select ?? []).map((t) => t.name),
        updatedAt: page.last_edited_time,
      });
    }

    cursor = r.has_more ? r.next_cursor ?? undefined : undefined;
  } while (cursor);

  return rows;
}

export function disconnect(): void {
  const path = configPath();
  if (existsSync(path)) {
    writeFileSync(path, "");
    try {
      const { unlinkSync } = require("node:fs") as typeof import("node:fs");
      unlinkSync(path);
    } catch {
      // ignored
    }
  }
}
