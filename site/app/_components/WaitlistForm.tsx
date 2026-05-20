"use client";

/**
 * Waitlist form — backend-free. POSTs directly to Web3Forms (or any compatible
 * email-forwarding service). No database, no Edge Functions, no Vercel API
 * routes required. Works on GitHub Pages, Vercel static, anywhere.
 *
 * Set NEXT_PUBLIC_WEB3FORMS_KEY in your env. Get the key (free, no dashboard
 * needed) at https://web3forms.com/ — they email you on every submission.
 *
 * To switch backends later (Formspree, Getform, Supabase, your own):
 *  - Replace WEB3FORMS_ENDPOINT with the target URL
 *  - Replace the access_key field with whatever the new backend expects
 *  - The form fields below stay the same
 */
import { useState, FormEvent } from "react";

const TOOLS = [
  "Claude Code",
  "Cursor",
  "VS Code",
  "Claude Desktop",
  "Cline",
  "Windsurf",
  "Codex CLI",
  "ChatGPT",
  "Other",
];

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [pain, setPain] = useState("");
  const [willingToPay, setWillingToPay] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTool(t: string) {
    setSelectedTools((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
    if (!accessKey) {
      setError("Form not configured. Set NEXT_PUBLIC_WEB3FORMS_KEY in your build env.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `New Snapcommit waitlist signup: ${email}`,
          from_name: "Snapcommit Waitlist",
          email,
          tools_used: selectedTools.join(", "),
          pain,
          willing_to_pay: willingToPay,
          referrer: typeof document !== "undefined" ? document.referrer : "",
          // Web3Forms honeypot — bots fill this; humans don't.
          botcheck: "",
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        setError(data?.message ?? `Submission failed (${res.status})`);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="text-sm">
        <p className="text-[var(--accent)] font-medium mb-3">You're in. Welcome.</p>
        <p className="text-[var(--muted)] mb-4">
          We'll email when beta opens — weeks, not months. First 500 on the waitlist get
          founders' pricing locked for life.
        </p>
        <p className="text-[var(--muted)]">
          Want to move up the queue? Share <code className="text-[var(--fg)]">snapcommit.com</code>{" "}
          with one friend who's tired of re-explaining their project to AI every session.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 font-mono"
        >
          email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@somewhere.dev"
          className="w-full bg-transparent border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 font-mono">
          which AI tools do you use weekly?
        </label>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => toggleTool(t)}
              className={`text-xs px-2.5 py-1 rounded border font-mono ${
                selectedTools.includes(t)
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="pain"
          className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 font-mono"
        >
          biggest frustration with how your AI handles context
        </label>
        <textarea
          id="pain"
          rows={3}
          value={pain}
          onChange={(e) => setPain(e.target.value)}
          placeholder="One sentence. The thing that makes you sigh."
          className="w-full bg-transparent border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 font-mono">
          if it actually worked, what would you pay monthly?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {["$0", "$5–10", "$10–30", "$30+"].map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setWillingToPay(opt)}
              className={`text-xs py-2 rounded border font-mono ${
                willingToPay === opt
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

      <button
        type="submit"
        disabled={busy || !email}
        className="w-full bg-[var(--accent)] text-[var(--bg)] py-2.5 rounded font-medium disabled:opacity-50 text-sm"
      >
        {busy ? "joining…" : "join the waitlist →"}
      </button>

      <p className="text-[10px] text-[var(--muted)] text-center font-mono">
        No spam. We email twice: when beta opens and when v1 launches.
      </p>
    </form>
  );
}
