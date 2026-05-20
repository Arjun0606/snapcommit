/**
 * POST /functions/v1/demo-extract
 * Anonymous endpoint for the landing-page "try it" widget.
 * Rate limited per IP: 3 calls per 24h. No auth.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, options } from "../_shared/auth.ts";
import { runExtraction } from "../_shared/extract.ts";

const DAILY_LIMIT = 3;

function today(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const ip = clientIp(req);
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const day = today();
  const { data: usage } = await client
    .from("demo_usage")
    .select("count, day")
    .eq("ip", ip)
    .maybeSingle();

  const sameDay = usage?.day === day;
  const count = sameDay ? usage.count : 0;
  if (count >= DAILY_LIMIT) {
    return json(
      {
        error: "demo limit reached",
        message: "You've used your 3 free demo extractions today. Subscribe for unlimited at https://snapcommit.com/pricing",
      },
      429,
    );
  }

  const body = await req.json().catch(() => ({}));
  const content = body?.content;
  if (typeof content !== "string" || content.length < 20) {
    return json({ error: "content too short (min 20 chars)" }, 400);
  }
  if (content.length > 4000) {
    return json({ error: "demo input capped at 4000 chars — subscribe for full size" }, 400);
  }

  let result;
  try {
    result = await runExtraction(content);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }

  await client
    .from("demo_usage")
    .upsert(
      { ip, day, count: count + 1, updated_at: new Date().toISOString() },
      { onConflict: "ip" },
    );

  return json({
    memories: result.memories,
    demo_remaining: DAILY_LIMIT - (count + 1),
  });
});
