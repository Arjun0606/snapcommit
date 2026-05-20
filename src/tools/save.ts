import { z } from "zod";
import type { MemoryStore } from "../db.js";
import { detectProject } from "../project.js";
import { ensureDevice } from "../config.js";

export const saveMemorySchema = {
  content: z.string().min(1).describe("The memory content to save. Be specific — a decision, a rejected approach with reason, a preference, a fact about the codebase, or an open question."),
  project: z.string().optional().describe("Project this memory belongs to (e.g. 'snapcommit', 'cabbage', 'kalshi'). If omitted, auto-detected from git remote or CWD."),
  kind: z.enum(["decision", "rejection", "preference", "fact", "open_question"]).optional().describe("Type of memory. 'rejection' captures things tried-and-failed with reasons — important for not repeating mistakes."),
  tags: z.array(z.string()).optional().describe("Free-form tags for later filtering."),
};

/**
 * Factory takes the live MCP client name (e.g., 'claude-code', 'cursor') so
 * every saved memory carries its origin. Critical for users running multiple
 * agents against the same memory file.
 */
export function saveMemory(store: MemoryStore, getAgentName: () => string | null) {
  return async (args: {
    content: string;
    project?: string;
    kind?: "decision" | "rejection" | "preference" | "fact" | "open_question";
    tags?: string[];
  }) => {
    const project = args.project ?? detectProject() ?? undefined;
    const device = ensureDevice();
    const sourceAgent = getAgentName() ?? undefined;
    const saved = store.save({
      ...args,
      project,
      source_agent: sourceAgent,
      source_device: device.label,
    });
    return {
      content: [
        {
          type: "text" as const,
          text: `Saved memory #${saved.id} (${saved.kind}${saved.project ? `, project: ${saved.project}` : ""}${sourceAgent ? `, via: ${sourceAgent}` : ""})`,
        },
      ],
    };
  };
}
