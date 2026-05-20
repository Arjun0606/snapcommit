"use client";

import type { Memory } from "@/lib/db";
import { useState } from "react";
import { useRouter } from "next/navigation";

const KIND_COLORS: Record<Memory["kind"], string> = {
  decision: "text-emerald-400",
  rejection: "text-rose-400",
  preference: "text-blue-400",
  fact: "text-zinc-400",
  open_question: "text-amber-400",
};

export function MemoryList({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) {
    return (
      <div className="text-sm text-[var(--muted)] py-12 text-center font-mono">
        No memories yet. Use Claude Code, Cursor, or any MCP client — Snapcommit will start capturing.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {memories.map((m) => (
        <MemoryCard key={m.id} memory={m} />
      ))}
    </div>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(memory.content);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const tags = JSON.parse(memory.tags) as string[];

  async function save() {
    setBusy(true);
    const r = await fetch(`/api/memories/${memory.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setBusy(false);
    if (r.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function destroy() {
    if (!confirm("Delete this memory?")) return;
    setBusy(true);
    const r = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) router.refresh();
  }

  return (
    <article className="border border-[var(--border)] rounded p-4 hover:border-[#333] transition-colors">
      <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--muted)] mb-2">
        <span>#{memory.id}</span>
        <span className={KIND_COLORS[memory.kind]}>{memory.kind}</span>
        {memory.project && <span>· {memory.project}</span>}
        <span>· {memory.created_at.slice(0, 10)}</span>
        <div className="ml-auto flex gap-2">
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="hover:text-[var(--fg)]"
                disabled={busy}
              >
                edit
              </button>
              <button
                onClick={destroy}
                className="hover:text-rose-400"
                disabled={busy}
              >
                delete
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={Math.max(3, content.split("\n").length)}
            className="w-full bg-transparent border border-[var(--border)] rounded p-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="mt-2 flex gap-2 text-xs">
            <button
              onClick={save}
              disabled={busy}
              className="px-3 py-1 bg-[var(--accent)] text-[var(--bg)] rounded font-medium"
            >
              save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setContent(memory.content);
              }}
              className="px-3 py-1 border border-[var(--border)] rounded"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
      )}

      {tags.length > 0 && !editing && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="text-[10px] font-mono text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
