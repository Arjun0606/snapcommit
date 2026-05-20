import { z } from "zod";
import type { MemoryStore } from "../db.js";

export const updateMemorySchema = {
  id: z.number().int().positive().describe("Memory ID to update."),
  content: z.string().min(1).optional().describe("New content. Omit to keep existing."),
  project: z.string().optional().describe("New project. Omit to keep existing."),
  kind: z.enum(["decision", "rejection", "preference", "fact", "open_question"]).optional(),
  tags: z.array(z.string()).optional(),
};

export function updateMemory(store: MemoryStore) {
  return async (args: {
    id: number;
    content?: string;
    project?: string;
    kind?: "decision" | "rejection" | "preference" | "fact" | "open_question";
    tags?: string[];
  }) => {
    const updated = store.update(args.id, args);
    if (!updated) {
      return {
        content: [{ type: "text" as const, text: `Memory #${args.id} not found.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: `Updated memory #${updated.id}.` }],
    };
  };
}

export const deleteMemorySchema = {
  id: z.number().int().positive().describe("Memory ID to delete."),
};

export function deleteMemory(store: MemoryStore) {
  return async (args: { id: number }) => {
    const ok = store.delete(args.id);
    return {
      content: [
        {
          type: "text" as const,
          text: ok ? `Deleted memory #${args.id}.` : `Memory #${args.id} not found.`,
        },
      ],
      isError: !ok,
    };
  };
}
