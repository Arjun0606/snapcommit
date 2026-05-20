import Link from "next/link";

export const metadata = { title: "Privacy Policy — Snapcommit" };

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="font-semibold">snapcommit</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-invert" style={{ color: "var(--fg)" }}>
        <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)] mb-10">Last updated: May 2026</p>

        <p className="text-sm leading-relaxed mb-6">
          This policy explains what data Snapcommit collects, what it never collects, and what
          you control. It's written in plain English on purpose.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">What lives only on your machine</h2>
        <ul className="text-sm leading-relaxed space-y-2 mb-6">
          <li>• Your memory database (e.g. <code>~/.snapcommit-mcp/memories.db</code>)</li>
          <li>• Your local configuration (storage path, device id, cached tier)</li>
          <li>• Any cloud-folder copy of the database you've chosen to make (iCloud / Dropbox / OneDrive / Google Drive / Notion mirror)</li>
        </ul>
        <p className="text-sm leading-relaxed mb-6">
          None of these reach Snapcommit servers. They're files on your computer or your own
          cloud provider's storage. We have no API into your iCloud or Dropbox.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">What we receive when you use AI extraction</h2>
        <p className="text-sm leading-relaxed mb-3">
          When you invoke smart-extraction (a paid feature), our cloud receives the conversation
          chunk you asked to extract. We proxy it to an LLM provider (OpenAI's GPT-5 Nano or
          Google's Gemini 2.5 Flash, depending on availability) using our own API keys.
        </p>
        <p className="text-sm leading-relaxed mb-3">
          <strong>The content is processed in-flight and is never written to our database.</strong>
          {" "}LLM providers may retain prompts under their own policies; we send a no-train header
          where supported. The structured memories returned by the LLM go back to your machine
          and are saved to your local file.
        </p>
        <p className="text-sm leading-relaxed mb-6">
          We log only metadata: <code>(user_id, timestamp, model name, input/output token counts,
          success flag)</code>. We don't log prompts, responses, IPs, user agents, or anything else.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">What we keep about your account</h2>
        <ul className="text-sm leading-relaxed space-y-2 mb-6">
          <li>• Email address (so Dodo Payments can send you receipts and we can email magic-links)</li>
          <li>• SHA-256 hash of your API token (never the cleartext)</li>
          <li>• Current subscription tier and monthly quota (cached from Dodo)</li>
          <li>• Dodo customer ID (so we can open billing portal sessions)</li>
          <li>• Monthly usage counters per user (for quota enforcement only)</li>
        </ul>
        <p className="text-sm leading-relaxed mb-6">
          That's the complete list. We don't keep your IP, device fingerprint, browser
          history, location, behavioural data, anything else.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Demo widget (anonymous)</h2>
        <p className="text-sm leading-relaxed mb-6">
          When you use the live demo on the homepage, your IP is hashed to enforce the
          3-per-day rate limit. The IP hash and a daily count are stored. The content you
          paste into the demo is processed in-flight by the LLM and never persisted. No
          account creation, no cookies, no tracking.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Payment data</h2>
        <p className="text-sm leading-relaxed mb-6">
          Dodo Payments is our merchant of record. They handle all card details, billing
          addresses, tax compliance, and PCI requirements. We never see your card. We
          receive only your email and subscription state from Dodo via webhook.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Third parties</h2>
        <ul className="text-sm leading-relaxed space-y-2 mb-6">
          <li>• <strong>Supabase</strong> — hosts our database and Edge Functions.</li>
          <li>• <strong>Dodo Payments</strong> — processes payments + handles billing emails.</li>
          <li>• <strong>OpenAI</strong> / <strong>Google</strong> — receive your conversation chunks during smart-extraction (in-flight only).</li>
          <li>• <strong>Resend</strong> (via Supabase) — sends transactional emails (magic links, receipts).</li>
          <li>• <strong>Vercel</strong> — hosts snapcommit.com (the static landing page).</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-3">Your rights</h2>
        <ul className="text-sm leading-relaxed space-y-2 mb-6">
          <li>• <strong>Access:</strong> email hello@snapcommit.com — we'll send everything we have about you (it's a small file).</li>
          <li>• <strong>Delete:</strong> run <code>snapcommit_delete_account</code> in your AI tool, confirm via email. Everything cloud-side is wiped within hours.</li>
          <li>• <strong>Export:</strong> <code>snapcommit_export_memories</code> at any time. JSON or Markdown.</li>
          <li>• <strong>Object to processing:</strong> stop using the product, your data goes away.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-10 mb-3">Children</h2>
        <p className="text-sm leading-relaxed mb-6">
          Snapcommit is for developers. We don't knowingly collect data from anyone under 16.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Changes</h2>
        <p className="text-sm leading-relaxed mb-6">
          If we change this policy, we'll update the "last updated" date and email active
          subscribers. Material changes (e.g., new third-party processors) require 30 days
          notice before they take effect.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Contact</h2>
        <p className="text-sm leading-relaxed mb-6">
          <a href="mailto:hello@snapcommit.com" className="underline">hello@snapcommit.com</a>
        </p>
      </main>
    </div>
  );
}
