import { z } from "zod";
import type { MemoryStore, Memory } from "../db.js";
import { detectProject } from "../project.js";

export const recallMemorySchema = {
  query: z.string().describe("What to search for in memory. Use natural language — keywords, topics, decisions you might have made."),
  project: z.string().optional().describe("Limit search to a specific project. If omitted, auto-scopes to the detected current project."),
  limit: z.number().int().positive().max(50).optional().describe("Max results to return (default 10)."),
  all_projects: z.boolean().optional().describe("If true, search across all projects regardless of detection. Default false."),
};

function formatMemory(m: Memory): string {
  const tags = JSON.parse(m.tags) as string[];
  const meta = [
    `#${m.id}`,
    m.kind,
    m.project ? `project=${m.project}` : null,
    tags.length ? `tags=${tags.join(",")}` : null,
    m.created_at.slice(0, 10),
  ].filter(Boolean).join(" · ");
  return `[${meta}]\n${m.content}`;
}

export function recallMemory(store: MemoryStore) {
  return async (args: {
    query: string;
    project?: string;
    limit?: number;
    all_projects?: boolean;
  }) => {
    const scoped = args.all_projects ? undefined : (args.project ?? detectProject() ?? undefined);
    const results = store.search(args.query, scoped, args.limit ?? 10);
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No memories matching "${args.query}"${scoped ? ` in project '${scoped}'` : ""}.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: results.map(formatMemory).join("\n\n---\n\n"),
        },
      ],
    };
  };
}
