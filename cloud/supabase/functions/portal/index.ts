/**
 * POST /functions/v1/portal
 * Generate a one-time URL to the user's Dodo Payments customer portal.
 */
import { json, options, lookupByToken } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!auth) return json({ error: "unauthorized" }, 401);

  const user = await lookupByToken(auth);
  if (!user) return json({ error: "invalid token" }, 401);
  if (!user.dodo_customer_id) {
    return json(
      { error: "no billing account on file. Subscribe at https://snapcommit.com/pricing" },
      400,
    );
  }

  const dodoKey = Deno.env.get("DODO_API_KEY")!;
  const res = await fetch("https://api.dodopayments.com/v1/portal/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${dodoKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      customer_id: user.dodo_customer_id,
      return_url: "https://snapcommit.com/account",
    }),
  });

  if (!res.ok) {
    return json({ error: `dodo ${res.status}: ${await res.text()}` }, 502);
  }
  const data = await res.json();
  return json({ url: data.url });
});
