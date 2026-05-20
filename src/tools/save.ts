import { z } from "zod";
import type { MemoryStore } from "../db.js";

export const saveMemorySchema = {
  content: z.string().min(1).describe("The memory content to save. Be specific — a decision, a rejected approach with reason, a preference, a fact about the codebase, or an open question."),
  project: z.string().optional().describe("Project this memory belongs to (e.g. 'snapcommit', 'cabbage', 'kalshi'). Optional but strongly recommended for routing."),
  kind: z.enum(["decision", "rejection", "preference", "fact", "open_question"]).optional().describe("Type of memory. 'rejection' captures things tried-and-failed with reasons — important for not repeating mistakes."),
  tags: z.array(z.string()).optional().describe("Free-form tags for later filtering."),
};

export function saveMemory(store: MemoryStore) {
  return async (args: {
    content: string;
    project?: string;
    kind?: "decision" | "rejection" | "preference" | "fact" | "open_question";
    tags?: string[];
  }) => {
    const saved = store.save(args);
    return {
      content: [
        {
          type: "text" as const,
          text: `Saved memory #${saved.id} (${saved.kind}${saved.project ? `, project: ${saved.project}` : ""})`,
        },
      ],
    };
  };
}
