"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Signup failed (${res.status})`);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/" className="font-semibold">snapcommit</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold mb-2">Start free</h1>
          <p className="text-sm text-[var(--muted)] mb-8">
            3 AI extractions lifetime + unlimited local memory. No credit card. Cancel by closing the tab.
          </p>

          {sent ? (
            <div className="border border-[var(--accent)] rounded p-6 text-sm">
              <p className="mb-2"><strong>Check your inbox.</strong></p>
              <p className="text-[var(--muted)]">
                We sent your API token to <strong className="text-[var(--fg)]">{email}</strong>. Open it,
                copy the token, and run in your AI tool:
              </p>
              <pre className="bg-black mt-4 p-3 rounded font-mono text-xs">
{`"Sign in to Snapcommit
 with token sct_live_..."`}
              </pre>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-2 font-mono">
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

              {error && (
                <p className="text-xs text-rose-400 font-mono">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[var(--accent)] text-[var(--bg)] py-2.5 rounded font-medium disabled:opacity-50"
              >
                {busy ? "sending…" : "send my token →"}
              </button>

              <p className="text-xs text-[var(--muted)] text-center pt-2">
                By signing up you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
                <Link href="/privacy" className="underline">privacy</Link>.
              </p>
            </form>
          )}

          <p className="text-xs text-[var(--muted)] mt-12 text-center">
            Already signed up?{" "}
            <a href="mailto:hello@snapcommit.com" className="underline">Lost your token? Email us.</a>
          </p>
        </div>
      </main>
    </div>
  );
}
