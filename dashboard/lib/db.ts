/**
 * Dashboard's view into the shared SQLite database. Reads (and writes) the
 * same `~/.snapcommit-mcp/memories.db` file the MCP server uses.
 * We don't bundle our own schema — we just open the file.
 */
import "server-only";
import Database from "better-sqlite3";
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

export interface Memory {
  id: number;
  content: string;
  project: string | null;
  kind: "decision" | "rejection" | "preference" | "fact" | "open_question";
  tags: string;
  created_at: string;
  updated_at: string;
}

function dbPath(): string {
  return join(homedir(), ".snapcommit-mcp", "memories.db");
}

let cached: Database.Database | null = null;

export function db(): Database.Database | null {
  if (cached) return cached;
  const path = dbPath();
  if (!existsSync(path)) return null;
  cached = new Database(path, { readonly: false });
  cached.pragma("journal_mode = WAL");
  return cached;
}

export function isInstalled(): boolean {
  return existsSync(dbPath());
}

export function recent(project?: string, limit = 50): Memory[] {
  const conn = db();
  if (!conn) return [];
  const sql = project
    ? `SELECT * FROM memories WHERE project = ? ORDER BY created_at DESC LIMIT ?`
    : `SELECT * FROM memories ORDER BY created_at DESC LIMIT ?`;
  const params = project ? [project, limit] : [limit];
  return conn.prepare(sql).all(...params) as Memory[];
}

export function search(query: string, project?: string, limit = 50): Memory[] {
  const conn = db();
  if (!conn) return [];
  if (!query.trim()) return recent(project, limit);
  const escaped = query.replace(/"/g, '""');
  const ftsQuery = escaped
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"`)
    .join(" OR ");

  const sql = project
    ? `SELECT m.* FROM memories m JOIN memories_fts fts ON fts.rowid = m.id WHERE memories_fts MATCH ? AND m.project = ? ORDER BY rank LIMIT ?`
    : `SELECT m.* FROM memories m JOIN memories_fts fts ON fts.rowid = m.id WHERE memories_fts MATCH ? ORDER BY rank LIMIT ?`;
  const params = project ? [ftsQuery, project, limit] : [ftsQuery, limit];
  return conn.prepare(sql).all(...params) as Memory[];
}

export function projects(): { name: string; count: number }[] {
  const conn = db();
  if (!conn) return [];
  return conn
    .prepare(
      `SELECT project AS name, COUNT(*) AS count FROM memories WHERE project IS NOT NULL GROUP BY project ORDER BY count DESC`,
    )
    .all() as { name: string; count: number }[];
}

export function total(): number {
  const conn = db();
  if (!conn) return 0;
  return (conn.prepare(`SELECT COUNT(*) AS n FROM memories`).get() as { n: number }).n;
}

export function deleteMemory(id: number): boolean {
  const conn = db();
  if (!conn) return false;
  return conn.prepare(`DELETE FROM memories WHERE id = ?`).run(id).changes > 0;
}

export function updateContent(id: number, content: string): boolean {
  const conn = db();
  if (!conn) return false;
  return (
    conn
      .prepare(`UPDATE memories SET content = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(content, id).changes > 0
  );
}
