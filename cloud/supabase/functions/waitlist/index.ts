/**
 * POST /functions/v1/waitlist
 * Anonymous waitlist signup. Inserts into public.waitlist.
 * Returns { ok: true, position: N } where N is the user's position in line.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, options } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "invalid email" }, 400);
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { error: insErr } = await client.from("waitlist").upsert(
    {
      email,
      tools: Array.isArray(body.tools) ? body.tools : [],
      pain: typeof body.pain === "string" ? body.pain : null,
      willing_to_pay: typeof body.willing_to_pay === "string" ? body.willing_to_pay : null,
      source: typeof body.source === "string" ? body.source : null,
    },
    { onConflict: "email", ignoreDuplicates: false },
  );

  if (insErr) return json({ error: insErr.message }, 500);

  // Compute position (rank by created_at ascending)
  const { count } = await client
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  return json({ ok: true, position: count ?? null });
});
