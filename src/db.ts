import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { resolveStoragePath } from "./config.js";

export interface Memory {
  id: number;
  content: string;
  project: string | null;
  kind: "decision" | "rejection" | "preference" | "fact" | "open_question";
  tags: string;
  source_agent: string | null;
  source_device: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewMemory {
  content: string;
  project?: string;
  kind?: Memory["kind"];
  tags?: string[];
  source_agent?: string;
  source_device?: string;
}

function dbPath(): string {
  const path = resolveStoragePath();
  mkdirSync(dirname(path), { recursive: true });
  return path;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(path: string = dbPath()) {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  private migrate(): void {
    // 1. Base table — creates if absent, no-op if it already exists with the
    //    older schema (we'll patch columns next).
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        project TEXT,
        kind TEXT NOT NULL DEFAULT 'fact',
        tags TEXT NOT NULL DEFAULT '[]',
        source_agent TEXT,
        source_device TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 2. Forward-compat ALTERs. CREATE TABLE IF NOT EXISTS is a no-op for
    //    pre-existing tables, so older DBs miss the source_* columns until
    //    we add them here. Try/catch handles already-migrated DBs.
    try {
      this.db.exec(`ALTER TABLE memories ADD COLUMN source_agent TEXT`);
    } catch {
      /* column already exists */
    }
    try {
      this.db.exec(`ALTER TABLE memories ADD COLUMN source_device TEXT`);
    } catch {
      /* column already exists */
    }

    // 3. Indexes and FTS — safe to run now that columns are guaranteed present.
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_project ON memories(project);
      CREATE INDEX IF NOT EXISTS idx_kind ON memories(kind);
      CREATE INDEX IF NOT EXISTS idx_created ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_source_agent ON memories(source_agent);
      CREATE INDEX IF NOT EXISTS idx_source_device ON memories(source_device);

      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        tags,
        project UNINDEXED,
        content='memories',
        content_rowid='id'
      );

      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, content, tags, project)
        VALUES (new.id, new.content, new.tags, new.project);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, tags, project)
        VALUES ('delete', old.id, old.content, old.tags, old.project);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, tags, project)
        VALUES ('delete', old.id, old.content, old.tags, old.project);
        INSERT INTO memories_fts(rowid, content, tags, project)
        VALUES (new.id, new.content, new.tags, new.project);
      END;
    `);
  }

  save(m: NewMemory): Memory {
    const stmt = this.db.prepare(`
      INSERT INTO memories (content, project, kind, tags, source_agent, source_device)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const result = stmt.get(
      m.content,
      m.project ?? null,
      m.kind ?? "fact",
      JSON.stringify(m.tags ?? []),
      m.source_agent ?? null,
      m.source_device ?? null,
    ) as Memory;
    return result;
  }

  /** Distinct devices that have written memories to this DB. */
  devices(): { id: string; count: number }[] {
    return this.db
      .prepare(
        `SELECT source_device AS id, COUNT(*) AS count
           FROM memories
          WHERE source_device IS NOT NULL
       GROUP BY source_device
       ORDER BY count DESC`,
      )
      .all() as { id: string; count: number }[];
  }

  /** Distinct AI agents that have written memories to this DB. */
  agents(): { name: string; count: number }[] {
    return this.db
      .prepare(
        `SELECT source_agent AS name, COUNT(*) AS count
           FROM memories
          WHERE source_agent IS NOT NULL
       GROUP BY source_agent
       ORDER BY count DESC`,
      )
      .all() as { name: string; count: number }[];
  }

  search(query: string, project?: string, limit = 20): Memory[] {
    const escaped = query.replace(/"/g, '""');
    const ftsQuery = escaped
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => `"${t}"`)
      .join(" OR ");

    if (!ftsQuery) return this.recent(project, limit);

    const sql = project
      ? `
        SELECT m.* FROM memories m
        JOIN memories_fts fts ON fts.rowid = m.id
        WHERE memories_fts MATCH ? AND m.project = ?
        ORDER BY rank
        LIMIT ?
      `
      : `
        SELECT m.* FROM memories m
        JOIN memories_fts fts ON fts.rowid = m.id
        WHERE memories_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `;

    const params = project ? [ftsQuery, project, limit] : [ftsQuery, limit];
    return this.db.prepare(sql).all(...params) as Memory[];
  }

  recent(project?: string, limit = 20): Memory[] {
    const sql = project
      ? `SELECT * FROM memories WHERE project = ? ORDER BY created_at DESC LIMIT ?`
      : `SELECT * FROM memories ORDER BY created_at DESC LIMIT ?`;
    const params = project ? [project, limit] : [limit];
    return this.db.prepare(sql).all(...params) as Memory[];
  }

  byId(id: number): Memory | undefined {
    return this.db
      .prepare(`SELECT * FROM memories WHERE id = ?`)
      .get(id) as Memory | undefined;
  }

  update(id: number, patch: Partial<NewMemory>): Memory | undefined {
    const existing = this.byId(id);
    if (!existing) return undefined;

    const updated = {
      content: patch.content ?? existing.content,
      project: patch.project ?? existing.project,
      kind: patch.kind ?? existing.kind,
      tags: patch.tags ? JSON.stringify(patch.tags) : existing.tags,
    };

    this.db
      .prepare(
        `UPDATE memories SET content = ?, project = ?, kind = ?, tags = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .run(updated.content, updated.project, updated.kind, updated.tags, id);

    return this.byId(id);
  }

  delete(id: number): boolean {
    const r = this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(id);
    return r.changes > 0;
  }

  projects(): { name: string; count: number }[] {
    return this.db
      .prepare(
        `SELECT project AS name, COUNT(*) AS count FROM memories WHERE project IS NOT NULL GROUP BY project ORDER BY count DESC`,
      )
      .all() as { name: string; count: number }[];
  }

  count(): number {
    return (this.db.prepare(`SELECT COUNT(*) AS n FROM memories`).get() as { n: number }).n;
  }

  close(): void {
    this.db.close();
  }
}
