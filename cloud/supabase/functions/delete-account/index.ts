/**
 * POST /functions/v1/delete-account
 * Two-step deletion: confirm=false sends an email; confirm=true (with valid
 * signed JWT in the email link, or "confirm phrase" from MCP) actually deletes.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, options, lookupByToken } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!auth) return json({ error: "unauthorized" }, 401);

  const user = await lookupByToken(auth);
  if (!user) return json({ error: "invalid token" }, 401);

  const body = await req.json().catch(() => ({}));
  const confirm = body?.confirm === true;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  if (!confirm) {
    // Send confirmation email via Supabase Auth magic-link to a deletion confirmation page
    await client.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: {
        redirectTo: `https://snapcommit.com/delete-confirm`,
      },
    });
    return json({ state: "email_sent" });
  }

  // Cancel Dodo subscription if active
  if (user.dodo_customer_id) {
    const dodoKey = Deno.env.get("DODO_API_KEY");
    if (dodoKey) {
      await fetch(
        `https://api.dodopayments.com/v1/customers/${user.dodo_customer_id}/subscriptions/cancel`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${dodoKey}` },
        },
      ).catch(() => {
        /* best-effort */
      });
    }
  }

  // CASCADE delete: profile -> api_tokens, usage_monthly, extraction_log
  // Plus delete auth.users row
  await client.auth.admin.deleteUser(user.id);

  return json({ state: "deleted" });
});
