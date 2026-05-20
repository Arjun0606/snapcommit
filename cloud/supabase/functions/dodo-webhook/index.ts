/**
 * POST /functions/v1/dodo-webhook
 * Receives subscription lifecycle events from Dodo Payments.
 * Verifies HMAC signature, updates tier in profiles, fires off magic-link email
 * containing the API token on first subscription.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "../_shared/auth.ts";

const TIER_QUOTAS: Record<string, number> = {
  inactive: 0,
  hobby: 200,
  pro: 2000,
  studio: 10000,
};

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sct_live_${hex}`;
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const sig = req.headers.get("dodo-signature");
  const secret = Deno.env.get("DODO_WEBHOOK_SECRET");
  if (!sig || !secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
  return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body));
}

interface DodoEvent {
  event: string;
  data: {
    customer?: { email: string; id: string };
    subscription?: { tier?: string; status?: string };
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const raw = await req.text();
  if (!(await verifySignature(req, raw))) {
    return json({ error: "invalid signature" }, 401);
  }

  let event: DodoEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "invalid body" }, 400);
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const email = event.data.customer?.email;
  const dodoCustomerId = event.data.customer?.id;
  if (!email) return json({ error: "missing customer email" }, 400);

  // Resolve tier from subscription metadata
  const tier = (event.data.subscription?.tier ?? "inactive").toLowerCase();
  const monthlyQuota = TIER_QUOTAS[tier] ?? 0;

  switch (event.event) {
    case "subscription.created": {
      // Create or update the Supabase auth user (passwordless magic-link signup).
      // This sends them a confirmation email with the magic link.
      const { data: existing } = await client.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      let userId: string | undefined = existing?.users.find((u) => u.email === email)?.id;
      if (!userId) {
        const { data: created } = await client.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        userId = created.user?.id;
      }
      if (!userId) return json({ error: "could not create user" }, 500);

      // Update profile
      await client.from("profiles").update({
        tier,
        monthly_quota: monthlyQuota,
        dodo_customer_id: dodoCustomerId,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);

      // Mint API token
      const token = generateToken();
      const hash = await hashToken(token);
      await client.from("api_tokens").insert({
        user_id: userId,
        token_hash: hash,
        token_prefix: token.slice(0, 16),
      });

      // Email the token via Supabase Auth (uses Resend behind the scenes)
      // We use a magic-link signin to deliver the token in the page.
      await client.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `https://snapcommit.com/auth/callback?token=${token}` },
      });

      return json({ ok: true, state: "subscription_created" });
    }

    case "subscription.updated": {
      await client.from("profiles").update({
        tier,
        monthly_quota: monthlyQuota,
        updated_at: new Date().toISOString(),
      }).eq("email", email);
      return json({ ok: true, state: "subscription_updated" });
    }

    case "subscription.canceled":
    case "subscription.paused": {
      await client.from("profiles").update({
        tier: "inactive",
        monthly_quota: 0,
        updated_at: new Date().toISOString(),
      }).eq("email", email);
      return json({ ok: true, state: "subscription_inactive" });
    }

    default:
      return json({ ok: true, state: "ignored" });
  }
});
