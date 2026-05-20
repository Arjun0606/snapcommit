/**
 * POST /functions/v1/extract
 * Headers: Authorization: Bearer <snapcommit-api-token>
 * Body: { content: string }
 *
 * Authenticated extraction. Verifies the user's api token, checks subscription
 * tier (must be hobby/pro/studio), enforces quota, calls the LLM, logs metadata.
 *
 * Content is in-flight only — we never persist it. Period.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, options, lookupByToken, getUsage, incrementUsage } from "../_shared/auth.ts";
import { runExtraction } from "../_shared/extract.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!auth) return json({ error: "unauthorized" }, 401);

  const user = await lookupByToken(auth);
  if (!user) return json({ error: "invalid token" }, 401);
  if (user.tier === "inactive") {
    return json(
      {
        error: "subscription inactive",
        upgrade_url: "https://snapcommit.com/pricing",
      },
      402,
    );
  }

  const body = await req.json().catch(() => ({}));
  const content = body?.content;
  if (typeof content !== "string" || content.length < 20) {
    return json({ error: "content too short" }, 400);
  }
  if (content.length > 8000) {
    return json({ error: "content too long (max 8000 chars)" }, 400);
  }

  const used = await getUsage(user.id);
  if (used >= user.monthly_quota) {
    return json(
      { error: "quota exceeded", upgrade_url: "https://snapcommit.com/pricing" },
      402,
    );
  }

  let result;
  try {
    result = await runExtraction(content);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }

  const newUsed = await incrementUsage(user.id);

  // Log metadata only — never content
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  await client.from("extraction_log").insert({
    user_id: user.id,
    model: result.model,
    input_tokens: result.input_tokens ?? null,
    output_tokens: result.output_tokens ?? null,
    ok: true,
  });

  return json({
    memories: result.memories,
    usage: { used_this_month: newUsed, monthly_quota: user.monthly_quota },
  });
});
