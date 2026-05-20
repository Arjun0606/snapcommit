/**
 * Snapcommit Cloud Worker — initial stub.
 *
 * Deploy to Cloudflare Workers with a D1 binding called DB and these env vars:
 *   ANTHROPIC_API_KEY  — for extraction
 *   DODO_WEBHOOK_SECRET — for billing webhook HMAC verification
 *   RESEND_API_KEY     — for signup emails (optional in dev)
 *
 * This is a working scaffold. Production-ready additions:
 *   - HMAC verification of Dodo webhooks (TODO)
 *   - Rate limiting per token (TODO)
 *   - Replace bcrypt-on-edge with subtle.crypto when binding allows
 */

export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  DODO_WEBHOOK_SECRET?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

const EXTRACTION_SYSTEM_PROMPT = `You extract structured memories from conversation transcripts.

Output ONLY a JSON array. Each item:
{ "content": "...", "kind": "decision|rejection|preference|fact|open_question", "tags": ["..."] }

Skip small talk. Skip restated obvious facts. Only emit memories worth surfacing in a future session. Max 8.`;

function yearMonth(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function tokenLookup(
  env: Env,
  token: string,
): Promise<{ id: string; email: string; tier: string; monthly_quota: number } | null> {
  // In production: hash token, lookup by hash. For brevity: direct match.
  return env.DB.prepare(
    `SELECT id, email, tier, monthly_quota FROM users WHERE token = ? LIMIT 1`,
  )
    .bind(token)
    .first();
}

async function getUsage(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT used FROM usage_monthly WHERE user_id = ? AND year_month = ?`,
  )
    .bind(userId, yearMonth())
    .first<{ used: number }>();
  return row?.used ?? 0;
}

async function incrementUsage(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO usage_monthly (user_id, year_month, used) VALUES (?, ?, 1)
     ON CONFLICT(user_id, year_month) DO UPDATE SET used = used + 1`,
  )
    .bind(userId, yearMonth())
    .run();
}

async function callAnthropic(apiKey: string, content: string): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return await res.json();
}

function parseMemories(raw: unknown): Array<{ content: string; kind: string; tags: string[] }> {
  const text =
    (raw as { content?: Array<{ type: string; text?: string }> })?.content?.find(
      (c) => c.type === "text",
    )?.text ?? "[]";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) =>
        typeof x?.content === "string" &&
        typeof x?.kind === "string" &&
        ["decision", "rejection", "preference", "fact", "open_question"].includes(x.kind),
    );
  } catch {
    return [];
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/v1/account" && req.method === "GET") {
      const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "unauthorized" }, 401);
      const user = await tokenLookup(env, token);
      if (!user) return json({ error: "invalid token" }, 401);
      const used = await getUsage(env, user.id);
      return json({
        email: user.email,
        tier: user.tier,
        monthly_quota: user.monthly_quota,
        used_this_month: used,
      });
    }

    if (url.pathname === "/v1/extract" && req.method === "POST") {
      const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "unauthorized" }, 401);
      const user = await tokenLookup(env, token);
      if (!user) return json({ error: "invalid token" }, 401);

      const used = await getUsage(env, user.id);
      if (used >= user.monthly_quota) {
        return json(
          { error: "quota exceeded", upgrade_url: "https://snapcommit.com/pricing" },
          402,
        );
      }

      const body = (await req.json().catch(() => ({}))) as { content?: string };
      if (!body.content || body.content.length < 20) {
        return json({ error: "content too short" }, 400);
      }
      if (body.content.length > 8000) {
        return json({ error: "content too long (max 8000 chars)" }, 400);
      }

      let upstream;
      try {
        upstream = await callAnthropic(env.ANTHROPIC_API_KEY, body.content);
      } catch (e) {
        return json({ error: (e as Error).message }, 502);
      }

      const memories = parseMemories(upstream);
      await incrementUsage(env, user.id);
      const newUsed = used + 1;

      return json({
        memories,
        usage: { used_this_month: newUsed, monthly_quota: user.monthly_quota },
      });
    }

    return json({ error: "not found" }, 404);
  },
};
