/**
 * Shared LLM extraction logic — used by both /extract (paid) and /demo-extract (anonymous).
 * Primary: GPT-5 Nano. Failover: Gemini 2.5 Flash.
 * Content is processed in-flight. We never persist it.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You extract structured memories from conversation transcripts.

Output ONLY a JSON array. Each item:
{ "content": "...", "kind": "decision|rejection|preference|fact|open_question", "tags": ["..."] }

Skip small talk. Skip restated obvious facts. Only emit memories worth surfacing in a future session. Max 8.`;

export interface ExtractionResult {
  memories: Array<{ content: string; kind: string; tags: string[] }>;
  model: string;
  input_tokens?: number;
  output_tokens?: number;
}

export async function callOpenAINano(apiKey: string, content: string): Promise<ExtractionResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
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
  const data = await res.json();
  return {
    memories: parseMemoryJSON(data.choices?.[0]?.message?.content ?? "[]"),
    model: "gpt-5-nano",
    input_tokens: data.usage?.prompt_tokens,
    output_tokens: data.usage?.completion_tokens,
  };
}

export async function callGeminiFlash(apiKey: string, content: string): Promise<ExtractionResult> {
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
  const data = await res.json();
  return {
    memories: parseMemoryJSON(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"),
    model: "gemini-2.5-flash",
    input_tokens: data.usageMetadata?.promptTokenCount,
    output_tokens: data.usageMetadata?.candidatesTokenCount,
  };
}

export async function runExtraction(content: string): Promise<ExtractionResult> {
  const openai = Deno.env.get("OPENAI_API_KEY");
  const gemini = Deno.env.get("GEMINI_API_KEY");
  if (openai) {
    try {
      return await callOpenAINano(openai, content);
    } catch (e) {
      if (!gemini) throw e;
      return await callGeminiFlash(gemini, content);
    }
  }
  if (gemini) return await callGeminiFlash(gemini, content);
  throw new Error("no LLM provider configured");
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
