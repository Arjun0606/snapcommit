import { z } from "zod";
import type { MemoryStore, Memory } from "../db.js";

export const recallMemorySchema = {
  query: z.string().describe("What to search for in memory. Use natural language — keywords, topics, decisions you might have made."),
  project: z.string().optional().describe("Limit search to a specific project."),
  limit: z.number().int().positive().max(50).optional().describe("Max results to return (default 10)."),
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
  return async (args: { query: string; project?: string; limit?: number }) => {
    const results = store.search(args.query, args.project, args.limit ?? 10);
    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No memories matching "${args.query}"${args.project ? ` in project '${args.project}'` : ""}.`,
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
