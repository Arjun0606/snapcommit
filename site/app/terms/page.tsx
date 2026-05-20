import Link from "next/link";

export const metadata = { title: "Terms of Service — Snapcommit" };

export default function Terms() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="font-semibold">snapcommit</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-invert" style={{ color: "var(--fg)" }}>
        <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--muted)] mb-10">Last updated: May 2026</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. What Snapcommit is</h2>
        <p className="text-sm leading-relaxed mb-6">
          Snapcommit is two things: (a) an open-source MCP server that runs on your machine
          and stores memories in a file you own, available under the MIT license — and
          (b) a paid cloud service that runs LLM-based extraction on conversation chunks
          you send us. These terms cover the cloud service. The open-source MCP server is
          governed by its MIT license.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Account</h2>
        <p className="text-sm leading-relaxed mb-6">
          To use the paid cloud service you must subscribe via Dodo Payments. Subscription
          creates an account tied to your email and gives you an API token. You're
          responsible for keeping your token secure. Sharing it across people is fine; if
          abused, we may revoke it.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Subscription, billing, cancellation</h2>
        <p className="text-sm leading-relaxed mb-3">
          Three tiers: Hobby $9/month, Pro $29/month, Studio $129/month. Each tier includes
          a monthly extraction quota that resets on the 1st of each calendar month UTC.
        </p>
        <p className="text-sm leading-relaxed mb-3">
          Billing is handled by Dodo Payments as merchant of record. They handle tax. You
          can update payment method, change tier, or cancel anytime via the customer portal
          (accessible from the <code>snapcommit_open_billing</code> tool).
        </p>
        <p className="text-sm leading-relaxed mb-6">
          Cancellation takes effect at the end of your current billing period. No
          pro-rated refunds for partial months. If a payment fails, you keep your tier
          during Dodo's standard dunning grace period (~21 days), after which the
          subscription is paused and your tier reverts to "inactive."
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Acceptable use</h2>
        <ul className="text-sm leading-relaxed space-y-2 mb-6">
          <li>• Don't use Snapcommit for illegal activity, including extracting memories from communications you don't own.</li>
          <li>• Don't try to extract content meant to circumvent safety guardrails on the underlying LLMs.</li>
          <li>• Don't redistribute the cloud service as your own.</li>
          <li>• Don't deliberately overload the system or attempt to scrape other users' data.</li>
        </ul>
        <p className="text-sm leading-relaxed mb-6">
          We may suspend accounts that violate these rules, with a refund of unused time on
          your subscription.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Your content</h2>
        <p className="text-sm leading-relaxed mb-6">
          Your memories are yours. We never claim ownership. Conversation chunks you send to
          smart_extract are processed in-flight and never stored on our servers; see the
          Privacy Policy for details.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Service availability</h2>
        <p className="text-sm leading-relaxed mb-6">
          We don't guarantee uptime. The cloud service depends on Supabase, OpenAI, Google,
          and Dodo Payments — all of which can have outages outside our control. The MCP
          server's local features (save, recall, export, etc.) continue working when our
          cloud is unreachable.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Liability</h2>
        <p className="text-sm leading-relaxed mb-6">
          To the maximum extent permitted by law, Snapcommit's total liability to you for any
          dispute is capped at the amount you've paid Snapcommit in the prior 12 months.
          We are not liable for indirect damages, lost data, or lost profits. If you care
          about a memory not being lost, back it up — that's your responsibility, not ours.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes</h2>
        <p className="text-sm leading-relaxed mb-6">
          We may update these terms. Material changes (pricing, billing terms, acceptable
          use) require 30 days' notice via email and the option to cancel and receive a
          pro-rated refund for the unused portion of the current term.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">9. Shutting down</h2>
        <p className="text-sm leading-relaxed mb-6">
          If we decide to shut down the cloud service, we'll give 90 days' notice via
          email. The open-source MCP server continues working forever — local memory,
          export, Notion adapter, cloud presets, all of it. You won't lose access to your
          memories because of us.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">10. Governing law</h2>
        <p className="text-sm leading-relaxed mb-6">
          These terms are governed by the laws of India. Disputes go through the courts of
          Mumbai. (We'll update if Snapcommit incorporates elsewhere.)
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
        <p className="text-sm leading-relaxed mb-6">
          <a href="mailto:hello@snapcommit.com" className="underline">hello@snapcommit.com</a>
        </p>
      </main>
    </div>
  );
}
