"use client";

import { useState } from "react";

const SAMPLE = `me: I want to add memory to my AI coding sessions
ai: a few options — fine-tune the model, vector db, simple file
me: fine-tuning is too expensive. vector db feels overkill
ai: what about plain SQLite locally?
me: that works. one file, easy to back up, supports FTS5 for search
ai: should we let users encrypt it?
me: not for v1 — passphrase UX is bad. just chmod 600 the file
me: also we decided against Notion-as-primary earlier because of API rate limits and v5 breaking changes`;

interface Memory {
  content: string;
  kind: string;
  tags: string[];
}

const KIND_COLORS: Record<string, string> = {
  decision: "text-emerald-400",
  rejection: "text-rose-400",
  preference: "text-blue-400",
  fact: "text-zinc-400",
  open_question: "text-amber-400",
};

export function DemoWidget() {
  const [content, setContent] = useState(SAMPLE);
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function runDemo() {
    setBusy(true);
    setError(null);
    setMemories(null);
    try {
      const res = await fetch("/api/demo-extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? body.error ?? `Request failed (${res.status})`);
      } else {
        setMemories(body.memories);
        setRemaining(body.demo_remaining ?? null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2 block font-mono">
          paste a conversation snippet
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="w-full bg-black border border-[var(--border)] rounded p-3 text-sm font-mono focus:outline-none focus:border-[var(--accent)] resize-y"
          maxLength={4000}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-mono">
            {content.length} / 4000 chars
          </span>
          <button
            onClick={runDemo}
            disabled={busy || content.length < 20}
            className="bg-[var(--accent)] text-[var(--bg)] px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {busy ? "extracting…" : "extract memories →"}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2 block font-mono">
          extracted memories
        </label>
        <div className="bg-black border border-[var(--border)] rounded p-3 min-h-[24rem]">
          {error && (
            <p className="text-rose-400 text-sm font-mono">{error}</p>
          )}
          {!error && memories === null && !busy && (
            <p className="text-[var(--muted)] text-sm">Click "extract memories" to see what your AI will save automatically.</p>
          )}
          {!error && memories && memories.length === 0 && (
            <p className="text-[var(--muted)] text-sm">Nothing memory-worthy in that snippet. Try a chunk with decisions or rejected approaches.</p>
          )}
          {memories && memories.length > 0 && (
            <ul className="space-y-3">
              {memories.map((m, i) => (
                <li key={i} className="border-b border-[var(--border)]/50 pb-3 last:border-b-0">
                  <div className="text-[10px] font-mono mb-1">
                    <span className={KIND_COLORS[m.kind] ?? "text-[var(--muted)]"}>{m.kind}</span>
                    {m.tags.length > 0 && (
                      <span className="text-[var(--muted)]"> · {m.tags.join(", ")}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {remaining !== null && (
          <p className="text-[10px] text-[var(--muted)] mt-2 font-mono">
            {remaining} demo extractions remaining today on this IP. Subscribe at any tier for unlimited.
          </p>
        )}
      </div>
    </div>
  );
}
