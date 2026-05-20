/**
 * Shared helpers for Supabase Edge Functions.
 * Token verification (opaque sct_live_... tokens), tier checks, common JSON helpers.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UserProfile {
  id: string;
  email: string;
  tier: "inactive" | "hobby" | "pro" | "studio";
  monthly_quota: number;
  dodo_customer_id: string | null;
}

export function supabase(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { authorization: req.headers.get("authorization") ?? "" } },
  });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

export function options(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
}

export async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function lookupByToken(token: string): Promise<UserProfile | null> {
  const hash = await hashToken(token);
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data: tokenRow } = await client
    .from("api_tokens")
    .select("user_id, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!tokenRow || tokenRow.revoked_at) return null;
  const { data: profile } = await client
    .from("profiles")
    .select("id, email, tier, monthly_quota, dodo_customer_id")
    .eq("id", tokenRow.user_id)
    .maybeSingle();
  if (!profile) return null;
  // best-effort: update last_used_at
  await client
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", hash);
  return profile as UserProfile;
}

export function yearMonth(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getUsage(userId: string): Promise<number> {
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data } = await client
    .from("usage_monthly")
    .select("used")
    .eq("user_id", userId)
    .eq("year_month", yearMonth())
    .maybeSingle();
  return data?.used ?? 0;
}

export async function incrementUsage(userId: string): Promise<number> {
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const ym = yearMonth();
  await client.rpc("increment_usage", { p_user_id: userId, p_year_month: ym });
  return await getUsage(userId);
}
