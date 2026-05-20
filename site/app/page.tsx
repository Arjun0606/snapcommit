import Link from "next/link";
import { DemoWidget } from "./_components/DemoWidget";

const TIERS = [
  {
    name: "Hobby",
    price: "$9",
    period: "month",
    quota: "200 smart-extractions / month",
    cta: "Get Hobby",
    features: [
      "200 LLM-powered memory extractions / month",
      "Semantic search across memories",
      "Auto-deduplication",
      "Email support",
      "Everything in local OSS",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "month",
    quota: "2,000 smart-extractions / month",
    cta: "Get Pro",
    features: [
      "Everything in Hobby",
      "2,000 extractions / month",
      "Memory consolidation",
      "Conflict detection across devices",
      "Priority response on issues",
    ],
    highlight: true,
  },
  {
    name: "Studio",
    price: "$129",
    period: "month",
    quota: "10,000 smart-extractions / month",
    cta: "Get Studio",
    features: [
      "Everything in Pro",
      "10,000 extractions / month",
      "Custom extraction prompts",
      "Premium-model option (Haiku 4.5)",
      "Early access to new features",
    ],
  },
];

const COMPETITORS = [
  ["", "OpenMemory", "Supermemory", "Mem AI", "Snapcommit"],
  ["Truly local-first", "claims it, isn't", "no — server", "no — server", "yes"],
  ["You own the file", "—", "—", "—", "yes"],
  ["Works in 30+ MCP clients", "Chrome only", "2 platforms", "—", "yes"],
  ["Captures rejections + reasons", "—", "—", "—", "yes"],
  ["We store your conversations", "yes", "yes", "yes", "never"],
  ["Cross-device", "broken", "server lock-in", "server lock-in", "your own cloud"],
  ["Team sharing", "nope", "per-seat $$", "per-seat $$", "shared folder, $0"],
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">snapcommit</div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#demo" className="text-[var(--muted)] hover:text-[var(--fg)]">try it</a>
            <a href="#how" className="text-[var(--muted)] hover:text-[var(--fg)]">how</a>
            <a href="#pricing" className="text-[var(--muted)] hover:text-[var(--fg)]">pricing</a>
            <a href="https://github.com/Arjun0606/snapcommit" className="text-[var(--muted)] hover:text-[var(--fg)]">github</a>
            <Link href="#pricing" className="bg-[var(--accent)] text-[var(--bg)] px-3 py-1.5 rounded font-medium">subscribe</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="text-xs text-[var(--muted)] mb-6 font-mono">memory · local-first · MCP</div>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
          Your AI never forgets.<br />
          <span className="gradient-text">And we never see your data.</span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mb-10 leading-relaxed">
          The memory layer for Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf — and 24 more
          MCP clients. Your memories live in a file you own. Cross-device sync uses your existing cloud.
          AI extraction runs on our servers, in-flight only, never stored.
        </p>

        <div className="flex flex-wrap gap-3 items-center">
          <a href="#demo" className="bg-[var(--accent)] text-[var(--bg)] px-5 py-3 rounded-md font-medium">
            Try the demo →
          </a>
          <a
            href="https://github.com/Arjun0606/snapcommit"
            className="border border-[var(--border)] hover:border-[var(--muted)] px-5 py-3 rounded-md text-[var(--fg)] font-mono text-sm"
          >
            npx @snapcommit/install
          </a>
        </div>

        <p className="text-xs text-[var(--muted)] mt-6 font-mono">
          Local memory is free open source (MIT). Cloud AI extraction starts at $9/month.
        </p>
      </section>

      {/* DEMO */}
      <section id="demo" className="border-t border-[var(--border)] bg-[var(--bg-2)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-xs text-[var(--muted)] mb-4 font-mono">try it · 3 free / day · no signup</div>
          <h2 className="text-3xl font-semibold mb-4">See what Snapcommit pulls from a conversation.</h2>
          <p className="text-[var(--muted)] mb-10 max-w-2xl">
            Paste any conversation snippet. We'll extract the structured memories — decisions, rejected approaches with reasons, preferences, facts, open questions. This is what your AI will do automatically once you've subscribed.
          </p>
          <DemoWidget />
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <div className="text-xs text-[var(--muted)] mb-4 font-mono">why this exists</div>
            <h2 className="text-3xl font-semibold mb-4">
              Reddit's #1 dev complaint about AI tools: <span className="text-[var(--accent)]">they never remember you.</span>
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              91 hours per year wasted re-explaining context to AI per solo founder, per the analysis of
              500 Reddit complaints. Existing fixes are bad: OpenMemory ships your data to Mem0's cloud
              while claiming "local-first." Supermemory charges $19/mo to hold your data. Mem AI burned
              $40M trying to be a database.
            </p>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)] mb-4 font-mono">what we do differently</div>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="text-[var(--accent)]">→</span><span><strong>Your file.</strong> Memories live at a path you choose — local, iCloud, Dropbox, Notion, anywhere.</span></li>
              <li className="flex gap-3"><span className="text-[var(--accent)]">→</span><span><strong>Your sync.</strong> Your cloud provider handles cross-device, sharing, conflicts. We build none of that.</span></li>
              <li className="flex gap-3"><span className="text-[var(--accent)]">→</span><span><strong>Our compute.</strong> AI extraction runs through our cloud (GPT-5 Nano + Gemini Flash failover). Content is processed in-flight, never stored.</span></li>
              <li className="flex gap-3"><span className="text-[var(--accent)]">→</span><span><strong>Captures rejections.</strong> What you tried and why it didn't work — so the AI doesn't repeat mistakes. Nobody else does this.</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t border-[var(--border)] bg-[var(--bg-2)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-xs text-[var(--muted)] mb-4 font-mono">how it works</div>
          <h2 className="text-3xl font-semibold mb-12">Three commands. That's the whole setup.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-[var(--accent)] font-mono text-xs mb-2">step 1</div>
              <h3 className="font-semibold mb-2">Install (free, OSS)</h3>
              <pre className="bg-black border border-[var(--border)] rounded p-3 text-xs font-mono overflow-x-auto mb-3">
{`npx @snapcommit/install`}
              </pre>
              <p className="text-sm text-[var(--muted)]">
                Detects Claude Code, Cursor, Claude Desktop, Cline, Windsurf, Codex CLI — wires Snapcommit into each. Local memory works immediately, no account needed.
              </p>
            </div>

            <div>
              <div className="text-[var(--accent)] font-mono text-xs mb-2">step 2</div>
              <h3 className="font-semibold mb-2">Subscribe & sign in</h3>
              <pre className="bg-black border border-[var(--border)] rounded p-3 text-xs font-mono overflow-x-auto mb-3">
{`Sign in to Snapcommit
with token sct_live_...`}
              </pre>
              <p className="text-sm text-[var(--muted)]">
                Subscribe at any tier. You'll receive an API token by email. Paste it into your AI tool to unlock smart extraction.
              </p>
            </div>

            <div>
              <div className="text-[var(--accent)] font-mono text-xs mb-2">step 3</div>
              <h3 className="font-semibold mb-2">Use your AI normally</h3>
              <pre className="bg-black border border-[var(--border)] rounded p-3 text-xs font-mono overflow-x-auto mb-3">
{`# Claude Code:
> remember to use SQLite
> what did we decide
  about storage?`}
              </pre>
              <p className="text-sm text-[var(--muted)]">
                Your AI calls Snapcommit's tools automatically. Decisions, rejections, preferences captured and queryable across every tool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-xs text-[var(--muted)] mb-4 font-mono">how we compare</div>
          <h2 className="text-3xl font-semibold mb-10">Better in the ways that matter to consumers.</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {COMPETITORS[0].map((h, i) => (
                    <th key={i} className={`text-left py-3 px-2 text-xs font-mono uppercase tracking-wider ${i === 4 ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.slice(1).map((row, r) => (
                  <tr key={r} className="border-b border-[var(--border)]/50">
                    {row.map((cell, c) => (
                      <td key={c} className={`py-3 px-2 ${c === 0 ? "text-[var(--muted)]" : c === 4 ? "text-[var(--accent)] font-medium" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[var(--border)] bg-[var(--bg-2)]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-xs text-[var(--muted)] mb-4 font-mono">pricing</div>
          <h2 className="text-3xl font-semibold mb-4">Free where it matters. Honest where you pay.</h2>
          <p className="text-[var(--muted)] mb-12 max-w-2xl">
            <strong className="text-[var(--fg)]">Local memory is free open source.</strong> Storage is your file, sync is your cloud, the MCP server is MIT-licensed. The paid tiers unlock LLM-powered extraction running through our cloud. Cancel anytime. Tax included worldwide via Dodo Payments.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`border rounded-lg p-6 ${
                  tier.highlight
                    ? "border-[var(--accent)] bg-[var(--bg)]"
                    : "border-[var(--border)]"
                }`}
              >
                {tier.highlight && (
                  <div className="text-[10px] text-[var(--accent)] font-mono mb-2 uppercase tracking-wider">most popular</div>
                )}
                <h3 className="font-semibold mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-semibold">{tier.price}</span>
                  <span className="text-xs text-[var(--muted)]">/{tier.period}</span>
                </div>
                <p className="text-xs text-[var(--muted)] mb-5 font-mono">{tier.quota}</p>
                <ul className="text-sm space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2"><span className="text-[var(--accent)] text-xs mt-0.5">✓</span><span>{f}</span></li>
                  ))}
                </ul>
                <Link
                  href={`/checkout?tier=${tier.name.toLowerCase()}`}
                  className={`block w-full text-center py-2 rounded font-medium text-sm ${
                    tier.highlight
                      ? "bg-[var(--accent)] text-[var(--bg)]"
                      : "border border-[var(--border)] hover:border-[var(--muted)]"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--muted)] text-center">
            All paid tiers include unlimited local memory + all 22 MCP tools + Notion adapter + cloud presets. No setup fees. No hidden quotas. No team add-ons.
          </p>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between text-xs text-[var(--muted)]">
          <div>© 2026 Snapcommit. MIT licensed.</div>
          <div className="flex gap-6 font-mono">
            <a href="https://github.com/Arjun0606/snapcommit" className="hover:text-[var(--fg)]">github</a>
            <a href="https://github.com/Arjun0606/snapcommit/blob/main/cloud/SPEC.md" className="hover:text-[var(--fg)]">api spec</a>
            <Link href="/privacy" className="hover:text-[var(--fg)]">privacy</Link>
            <Link href="/terms" className="hover:text-[var(--fg)]">terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
