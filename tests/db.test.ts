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
});
