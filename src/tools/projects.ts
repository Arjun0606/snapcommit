import type { MemoryStore } from "../db.js";

export function listProjects(store: MemoryStore) {
  return async () => {
    const projects = store.projects();
    const total = store.count();
    if (projects.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No projects yet. Total memories: ${total}.`,
          },
        ],
      };
    }
    const lines = projects.map((p) => `${p.name}  (${p.count})`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Projects (${total} memories total):\n\n${lines.join("\n")}`,
        },
      ],
    };
  };
}
