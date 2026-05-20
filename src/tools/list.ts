import { z } from "zod";
import type { MemoryStore, Memory } from "../db.js";
import { detectProject } from "../project.js";

export const listMemoriesSchema = {
  project: z.string().optional().describe("Filter by project. If omitted, auto-scopes to detected current project. Pass empty string '' to show all."),
  kind: z.enum(["decision", "rejection", "preference", "fact", "open_question"]).optional().describe("Filter by memory type."),
  limit: z.number().int().positive().max(100).optional().describe("Max results (default 20)."),
};

function formatMemory(m: Memory): string {
  const tags = JSON.parse(m.tags) as string[];
  const meta = [
    `#${m.id}`,
    m.kind,
    m.project ? m.project : null,
    tags.length ? `[${tags.join(",")}]` : null,
    m.created_at.slice(0, 10),
  ].filter(Boolean).join(" · ");
  return `${meta}\n${m.content}`;
}

export function listMemories(store: MemoryStore) {
  return async (args: {
    project?: string;
    kind?: Memory["kind"];
    limit?: number;
  }) => {
    let scoped: string | undefined;
    if (args.project === "") scoped = undefined; // explicit "all"
    else if (args.project) scoped = args.project;
    else scoped = detectProject() ?? undefined;

    let memories = store.recent(scoped, args.limit ?? 20);
    if (args.kind) {
      memories = memories.filter((m) => m.kind === args.kind);
    }

    if (memories.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No memories${scoped ? ` in project '${scoped}'` : ""}${args.kind ? ` of kind '${args.kind}'` : ""}.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `${memories.length} memories${scoped ? ` in '${scoped}'` : ""}:\n\n${memories.map(formatMemory).join("\n\n")}`,
        },
      ],
    };
  };
}
