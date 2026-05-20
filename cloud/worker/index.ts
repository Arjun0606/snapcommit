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
  OPENAI_API_KEY: string;   // primary: GPT-5 Nano for structured extraction
  GEMINI_API_KEY?: string;  // failover: Gemini 2.5 Flash if OpenAI rate-limits
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

interface ExtractionResult {
  memories: Array<{ content: string; kind: string; tags: string[] }>;
  model: string;
  input_tokens?: number;
  output_tokens?: number;
}

async function callOpenAINano(apiKey: string, content: string): Promise<ExtractionResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  return {
    memories: parseMemoryJSON(data.choices[0]?.message?.content ?? "[]"),
    model: "gpt-5-nano",
    input_tokens: data.usage?.prompt_tokens,
    output_tokens: data.usage?.completion_tokens,
  };
}

async function callGeminiFlash(apiKey: string, content: string): Promise<ExtractionResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: content }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };
  const text = data.candidates[0]?.content?.parts?.[0]?.text ?? "[]";
  return {
    memories: parseMemoryJSON(text),
    model: "gemini-2.5-flash",
    input_tokens: data.usageMetadata?.promptTokenCount,
    output_tokens: data.usageMetadata?.candidatesTokenCount,
  };
}

async function extract(env: Env, content: string): Promise<ExtractionResult> {
  // Primary: GPT-5 Nano (best structured-output quality per benchmarks)
  // Failover: Gemini 2.5 Flash if OpenAI errors
  try {
    return await callOpenAINano(env.OPENAI_API_KEY, content);
  } catch (e) {
    if (!env.GEMINI_API_KEY) throw e;
    return await callGeminiFlash(env.GEMINI_API_KEY, content);
  }
}

function parseMemoryJSON(raw: string): Array<{ content: string; kind: string; tags: string[] }> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : (parsed.memories ?? []);
    return arr.filter(
      (x: { content?: unknown; kind?: unknown }) =>
        typeof x?.content === "string" &&
        typeof x?.kind === "string" &&
        ["decision", "rejection", "preference", "fact", "open_question"].includes(x.kind as string),
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

      let result: ExtractionResult;
      try {
        result = await extract(env, body.content);
      } catch (e) {
        return json({ error: (e as Error).message }, 502);
      }

      await incrementUsage(env, user.id);
      const newUsed = used + 1;

      // Log metadata only — never content
      await env.DB.prepare(
        `INSERT INTO extraction_log (user_id, model, input_tokens, output_tokens, ok) VALUES (?, ?, ?, ?, 1)`,
      )
        .bind(user.id, result.model, result.input_tokens ?? null, result.output_tokens ?? null)
        .run();

      return json({
        memories: result.memories,
        usage: { used_this_month: newUsed, monthly_quota: user.monthly_quota },
      });
    }

    return json({ error: "not found" }, 404);
  },
};
