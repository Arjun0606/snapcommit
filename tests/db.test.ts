import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryStore } from "../src/db.js";
import { unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let dbPath: string;
let store: MemoryStore;

beforeEach(() => {
  dbPath = join(tmpdir(), `snapcommit-test-${Date.now()}-${Math.random()}.db`);
  store = new MemoryStore(dbPath);
});

afterEach(() => {
  store.close();
  if (existsSync(dbPath)) unlinkSync(dbPath);
});

describe("MemoryStore", () => {
  describe("save", () => {
    it("stores a memory with all fields", () => {
      const m = store.save({
        content: "Use better-sqlite3",
        project: "snapcommit",
        kind: "decision",
        tags: ["storage"],
      });
      expect(m.id).toBeGreaterThan(0);
      expect(m.content).toBe("Use better-sqlite3");
      expect(m.project).toBe("snapcommit");
      expect(m.kind).toBe("decision");
      expect(JSON.parse(m.tags)).toEqual(["storage"]);
    });

    it("defaults kind to 'fact' when not provided", () => {
      const m = store.save({ content: "Some fact" });
      expect(m.kind).toBe("fact");
    });

    it("allows null project", () => {
      const m = store.save({ content: "Universal preference" });
      expect(m.project).toBeNull();
    });
  });

  describe("search", () => {
    beforeEach(() => {
      store.save({
        content: "Tried Mem0 cloud, rejected — sends data to their servers",
        project: "snapcommit",
        kind: "rejection",
        tags: ["privacy"],
      });
      store.save({
        content: "Use SQLite with FTS5 for local search",
        project: "snapcommit",
        kind: "decision",
        tags: ["storage", "search"],
      });
      store.save({
        content: "Avoid React Class components",
        project: "dashboard",
        kind: "preference",
        tags: ["react"],
      });
    });

    it("finds memories by content keyword", () => {
      const results = store.search("SQLite");
      expect(results.length).toBe(1);
      expect(results[0].content).toContain("SQLite");
    });

    it("scopes search by project", () => {
      const inSnapcommit = store.search("rejected", "snapcommit");
      expect(inSnapcommit.length).toBe(1);
      const inDashboard = store.search("rejected", "dashboard");
      expect(inDashboard.length).toBe(0);
    });

    it("returns recent memories when query is empty", () => {
      const results = store.search("");
      expect(results.length).toBe(3);
    });

    it("respects limit", () => {
      const results = store.search("", undefined, 2);
      expect(results.length).toBe(2);
    });
  });

  describe("update", () => {
    it("updates content and preserves other fields", () => {
      const m = store.save({
        content: "Original",
        project: "snapcommit",
        kind: "decision",
      });
      const updated = store.update(m.id, { content: "Revised" });
      expect(updated?.content).toBe("Revised");
      expect(updated?.project).toBe("snapcommit");
      expect(updated?.kind).toBe("decision");
    });

    it("returns undefined for non-existent id", () => {
      const result = store.update(99999, { content: "Nope" });
      expect(result).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("deletes existing memory", () => {
      const m = store.save({ content: "Goodbye" });
      expect(store.delete(m.id)).toBe(true);
      expect(store.byId(m.id)).toBeUndefined();
    });

    it("returns false for non-existent id", () => {
      expect(store.delete(99999)).toBe(false);
    });
  });

  describe("projects", () => {
    it("groups memories by project with counts", () => {
      store.save({ content: "a", project: "alpha" });
      store.save({ content: "b", project: "alpha" });
      store.save({ content: "c", project: "beta" });
      store.save({ content: "d" });

      const projects = store.projects();
      expect(projects).toContainEqual({ name: "alpha", count: 2 });
      expect(projects).toContainEqual({ name: "beta", count: 1 });
      expect(projects.find((p) => p.name === null)).toBeUndefined();
    });
  });

  describe("count", () => {
    it("returns total memory count", () => {
      expect(store.count()).toBe(0);
      store.save({ content: "x" });
      store.save({ content: "y" });
      expect(store.count()).toBe(2);
    });
  });

  describe("rejection capture (the differentiator)", () => {
    it("treats rejections as first-class memories", () => {
      const rejection = store.save({
        content: "Tried Chrome extension scraping — DOM changes break it weekly",
        project: "snapcommit",
        kind: "rejection",
        tags: ["architecture", "abandoned"],
      });
      expect(rejection.kind).toBe("rejection");

      const found = store.search("Chrome extension scraping");
      expect(found[0].kind).toBe("rejection");
    });
  });

  describe("source tracking (multi-agent, multi-device segregation)", () => {
    it("records source_agent and source_device on save", () => {
      const m = store.save({
        content: "Decision from Claude Code on the work laptop",
        kind: "decision",
        source_agent: "claude-code",
        source_device: "arjun@macbook-pro",
      });
      expect(m.source_agent).toBe("claude-code");
      expect(m.source_device).toBe("arjun@macbook-pro");
    });

    it("returns null source fields when not provided", () => {
      const m = store.save({ content: "Agent-less memory" });
      expect(m.source_agent).toBeNull();
      expect(m.source_device).toBeNull();
    });

    it("devices() aggregates distinct source devices", () => {
      store.save({ content: "a", source_device: "laptop" });
      store.save({ content: "b", source_device: "laptop" });
      store.save({ content: "c", source_device: "phone" });
      store.save({ content: "d" });

      const devices = store.devices();
      expect(devices).toContainEqual({ id: "laptop", count: 2 });
      expect(devices).toContainEqual({ id: "phone", count: 1 });
      expect(devices.find((d) => d.id === null)).toBeUndefined();
    });

    it("agents() aggregates distinct AI agents", () => {
      store.save({ content: "x", source_agent: "claude-code" });
      store.save({ content: "y", source_agent: "claude-code" });
      store.save({ content: "z", source_agent: "cursor" });

      const agents = store.agents();
      expect(agents).toContainEqual({ name: "claude-code", count: 2 });
      expect(agents).toContainEqual({ name: "cursor", count: 1 });
    });
  });

  describe("schema migration (existing DBs without source columns)", () => {
    it("ALTER TABLE migration adds source columns without losing data", async () => {
      const fs = await import("node:fs");
      const Database = (await import("better-sqlite3")).default;

      const oldPath = `${dbPath}.old`;
      const old = new Database(oldPath);
      old.exec(`
        CREATE TABLE memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          project TEXT,
          kind TEXT NOT NULL DEFAULT 'fact',
          tags TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO memories (content) VALUES ('legacy memory before migration');
      `);
      old.close();

      // Open with the migrating MemoryStore — should add columns + preserve row
      const migrated = new MemoryStore(oldPath);
      const all = migrated.recent(undefined, 10);
      expect(all.length).toBe(1);
      expect(all[0].content).toBe("legacy memory before migration");
      expect(all[0].source_agent).toBeNull();
      expect(all[0].source_device).toBeNull();
      const fresh = migrated.save({
        content: "post-migration",
        source_agent: "cursor",
        source_device: "phone",
      });
      expect(fresh.source_agent).toBe("cursor");
      migrated.close();
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    });
  });
});
