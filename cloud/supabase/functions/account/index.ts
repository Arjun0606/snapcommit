/**
 * GET /functions/v1/account
 * Returns the signed-in user's tier, quota, and current usage.
 */
import { json, options, lookupByToken, getUsage } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "GET") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!auth) return json({ error: "unauthorized" }, 401);

  const user = await lookupByToken(auth);
  if (!user) return json({ error: "invalid token" }, 401);

  const used = await getUsage(user.id);

  return json({
    email: user.email,
    tier: user.tier,
    monthly_quota: user.monthly_quota,
    used_this_month: used,
  });
});
