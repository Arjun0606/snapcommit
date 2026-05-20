import { WaitlistForm } from "../_components/WaitlistForm";
import Link from "next/link";

export const metadata = {
  title: "Snapcommit — coming soon",
  description: "Memory for your AI tools. Get early access.",
};

export default function Waitlist() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">snapcommit</div>
          <Link href="https://github.com/Arjun0606/snapcommit" className="text-xs text-[var(--muted)] font-mono">github</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-20 pb-16">
        <div className="text-xs text-[var(--muted)] mb-6 font-mono">coming soon · early access</div>

        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
          Your AI never forgets.<br />
          <span className="gradient-text">And we never see your data.</span>
        </h1>

        <p className="text-lg text-[var(--muted)] max-w-2xl mb-10 leading-relaxed">
          We're building the memory layer for AI tools — Claude Code, Cursor, VS Code,
          Claude Desktop, and 25 more. Genuinely local. Cross-tool. Designed so we
          literally cannot see your conversations.
        </p>

        <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg p-6 mb-10">
          <h2 className="text-sm font-semibold mb-4 font-mono uppercase tracking-wider text-[var(--accent)]">
            join the waitlist
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            First 500 get founding-member pricing locked for life. Beta opens in weeks, not months. Tell us a bit about your workflow so we build for you.
          </p>
          <WaitlistForm />
        </div>

        <div className="border-t border-[var(--border)] pt-10">
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-4 font-mono">
            what you can already do today
          </h3>
          <ul className="text-sm space-y-2 text-[var(--muted)]">
            <li className="flex gap-2"><span className="text-[var(--accent)]">→</span> Star the open-source MCP server on <Link href="https://github.com/Arjun0606/snapcommit" className="underline">GitHub</Link></li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">→</span> Follow the build in public (Twitter announcements + GitHub commits)</li>
            <li className="flex gap-2"><span className="text-[var(--accent)]">→</span> Share with one friend who's frustrated re-explaining their project to AI every session</li>
          </ul>
        </div>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between text-xs text-[var(--muted)]">
          <div>© 2026 Snapcommit</div>
          <div className="flex gap-6 font-mono">
            <Link href="/privacy" className="hover:text-[var(--fg)]">privacy</Link>
            <Link href="/terms" className="hover:text-[var(--fg)]">terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
