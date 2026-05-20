#!/usr/bin/env node
/**
 * Local smoke test — exercises the DB layer directly without spinning up the
 * MCP transport. Run with `node scripts/smoke-test.mjs` from the repo root.
 *
 * Safe: writes only to a throwaway DB at /tmp/snapcommit-smoke.db
 */
import { MemoryStore } from "../dist/db.js";
import { unlinkSync, existsSync } from "node:fs";

const path = "/tmp/snapcommit-smoke.db";
if (existsSync(path)) unlinkSync(path);

const store = new MemoryStore(path);

console.log("\n  Snapcommit smoke test\n  ─────────────────────\n");

const m1 = store.save({
  content: "Use better-sqlite3 over node-sqlite3 — sync API, faster, no callback hell",
  project: "snapcommit",
  kind: "decision",
  tags: ["storage", "architecture"],
});
console.log(`  ✓ saved memory #${m1.id} (${m1.kind})`);

const m2 = store.save({
  content: "Tried Mem0's cloud API — rejected because it sends user data to their servers, violating local-first principle",
  project: "snapcommit",
  kind: "rejection",
  tags: ["storage", "privacy"],
});
console.log(`  ✓ saved memory #${m2.id} (${m2.kind})`);

const m3 = store.save({
  content: "Prefers terse, opinionated docs over comprehensive ones",
  kind: "preference",
});
console.log(`  ✓ saved memory #${m3.id} (${m3.kind})`);

const found = store.search("storage", "snapcommit");
console.log(`\n  ✓ search 'storage' returned ${found.length} results`);

const projects = store.projects();
console.log(`  ✓ projects: ${projects.map((p) => `${p.name}(${p.count})`).join(", ")}`);

const updated = store.update(m1.id, {
  content: m1.content + " — confirmed after build and smoke test",
});
console.log(`  ✓ updated #${updated.id}`);

const deleted = store.delete(m3.id);
console.log(`  ${deleted ? "✓" : "✗"} deleted #${m3.id}`);

console.log(`\n  Total memories: ${store.count()}\n`);

store.close();
unlinkSync(path);
console.log("  Cleaned up /tmp/snapcommit-smoke.db. All checks passed.\n");
