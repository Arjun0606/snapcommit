import { z } from "zod";
import type { MemoryStore, Memory } from "../db.js";

export const exportMemoriesSchema = {
  format: z.enum(["json", "markdown"]).optional().describe("Output format. JSON for portability, Markdown for human reading. Default markdown."),
  project: z.string().optional().describe("Only export memories from this project. Omit for all."),
  kind: z.enum(["decision", "rejection", "preference", "fact", "open_question"]).optional().describe("Only export memories of this kind."),
};

function asMarkdown(memories: Memory[]): string {
  if (memories.length === 0) return "_No memories to export._";

  const byProject = new Map<string, Memory[]>();
  for (const m of memories) {
    const key = m.project ?? "(no project)";
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(m);
  }

  const lines: string[] = ["# Snapcommit memory export", ""];
  lines.push(`_${memories.length} memories, exported ${new Date().toISOString()}_`, "");

  for (const [project, items] of byProject) {
    lines.push(`## ${project}`, "");
    const byKind = new Map<string, Memory[]>();
    for (const m of items) {
      if (!byKind.has(m.kind)) byKind.set(m.kind, []);
      byKind.get(m.kind)!.push(m);
    }
    for (const [kind, kindItems] of byKind) {
      lines.push(`### ${kind} (${kindItems.length})`, "");
      for (const m of kindItems) {
        const tags = JSON.parse(m.tags) as string[];
        const tagStr = tags.length ? ` _[${tags.join(", ")}]_` : "";
        lines.push(`- ${m.content}${tagStr}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function asJson(memories: Memory[]): string {
  return JSON.stringify(
    memories.map((m) => ({
      id: m.id,
      content: m.content,
      project: m.project,
      kind: m.kind,
      tags: JSON.parse(m.tags),
      created_at: m.created_at,
      updated_at: m.updated_at,
    })),
    null,
    2,
  );
}

export function exportMemories(store: MemoryStore) {
  return async (args: {
    format?: "json" | "markdown";
    project?: string;
    kind?: Memory["kind"];
  }) => {
    let memories = store.recent(args.project, 10000);
    if (args.kind) {
      memories = memories.filter((m) => m.kind === args.kind);
    }
    const format = args.format ?? "markdown";
    const text = format === "json" ? asJson(memories) : asMarkdown(memories);
    return {
      content: [{ type: "text" as const, text }],
    };
  };
}
