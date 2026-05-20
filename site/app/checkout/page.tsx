/**
 * /checkout?tier=hobby — redirects to Dodo Payments hosted checkout for the
 * chosen tier. Dodo collects payment, fires the subscription.created webhook,
 * and emails the user their API token.
 */
import { redirect } from "next/navigation";

const DODO_LINKS: Record<string, string | undefined> = {
  hobby: process.env.DODO_LINK_HOBBY,
  pro: process.env.DODO_LINK_PRO,
  studio: process.env.DODO_LINK_STUDIO,
};

export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const params = await searchParams;
  const tier = (params.tier ?? "hobby").toLowerCase();
  const url = DODO_LINKS[tier];
  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Tier not found</h1>
          <p className="text-sm text-[var(--muted)]">
            Try one of: hobby, pro, studio. <a href="/" className="underline">Back home</a>
          </p>
        </div>
      </div>
    );
  }
  redirect(url);
}
