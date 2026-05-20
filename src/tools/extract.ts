/**
 * Snapcommit Pro: smart_extract
 *
 * Takes a chunk of conversation context and extracts structured memories
 * (decisions, rejections, preferences, facts, open questions) using the
 * user's own API key. We never see the content.
 *
 * Gated on Pro license. Without it, this tool refuses with an upgrade
 * message. With it, calls run against the user's API key, our cost is $0.
 */
import { z } from "zod";
import type { MemoryStore } from "../db.js";
import { getApiKey, hasPro } from "../config.js";
import { detectProject } from "../project.js";

const EXTRACTION_SYSTEM_PROMPT = `You extract structured memories from conversation transcripts.

Output ONLY a JSON array. Each item:
{
  "content": "the memory itself, written as a concise standalone statement",
  "kind": "decision" | "rejection" | "preference" | "fact" | "open_question",
  "tags": ["short", "tags"]
}

Rules:
- decision: a choice that was made (e.g., "Use SQLite for local storage")
- rejection: an approach tried or considered and explicitly rejected, INCLUDING the reason ("Tried X — rejected because Y")
- preference: stable user/team preference ("Prefers terse code comments")
- fact: a non-obvious truth about the codebase or domain ("API uses cursor pagination via 'next' param")
- open_question: unresolved item ("Still unclear whether to use OAuth or API keys")

Be ruthless. Skip small talk. Skip things that are already documented. Skip restated obvious facts. Only emit memories worth surfacing in a future session.

Maximum 8 memories per call.
Output strictly valid JSON. No prose. No code fences. Just the array.`;

async function callAnthropic(apiKey: string, content: string): Promise<string> {
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
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
  return data.content.find((c) => c.type === "text")?.text ?? "[]";
}

async function callOpenAI(apiKey: string, content: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices[0]?.message?.content ?? "[]";
  // OpenAI's JSON mode wraps in an object — accept either shape
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return raw;
    if (parsed.memories && Array.isArray(parsed.memories)) {
      return JSON.stringify(parsed.memories);
    }
    return "[]";
  } catch {
    return "[]";
  }
}

interface Extracted {
  content: string;
  kind: "decision" | "rejection" | "preference" | "fact" | "open_question";
  tags: string[];
}

function parseExtracted(raw: string): Extracted[] {
  // Strip code fences if model added them despite instructions
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is Extracted =>
        typeof x?.content === "string" &&
        typeof x?.kind === "string" &&
        ["decision", "rejection", "preference", "fact", "open_question"].includes(x.kind),
    );
  } catch {
    return [];
  }
}

export const smartExtractSchema = {
  content: z.string().min(20).describe("Conversation transcript or notes to extract memories from. Paste a session summary, recent exchanges, or any text."),
  project: z.string().optional().describe("Project to tag the extracted memories with. Auto-detected from git remote if omitted."),
  dry_run: z.boolean().optional().describe("If true, return the extracted memories without saving. Default false."),
};

export function smartExtract(store: MemoryStore) {
  return async (args: { content: string; project?: string; dry_run?: boolean }) => {
    if (!hasPro()) {
      return {
        content: [{
          type: "text" as const,
          text: "smart_extract requires Snapcommit Pro.\n\nPro is $99 lifetime via Dodo Payments. It unlocks LLM-based memory extraction using your own API key (BYOK — we never see your content). Visit https://snapcommit.com/pro to upgrade. Already have a key? Call snapcommit_activate_license with it.",
        }],
        isError: true,
      };
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        content: [{
          type: "text" as const,
          text: "No API key configured. Pro extraction uses YOUR Anthropic or OpenAI key (BYOK). Set one with: snapcommit_set_api_key provider=anthropic key=sk-...",
        }],
        isError: true,
      };
    }

    let raw: string;
    try {
      raw = apiKey.provider === "anthropic"
        ? await callAnthropic(apiKey.key, args.content)
        : await callOpenAI(apiKey.key, args.content);
    } catch (e) {
      return {
        content: [{ type: "text" as const, text: `Extraction call failed: ${(e as Error).message}` }],
        isError: true,
      };
    }

    const extracted = parseExtracted(raw);
    if (extracted.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No memories worth extracting from that content." }],
      };
    }

    const project = args.project ?? detectProject() ?? undefined;

    if (args.dry_run) {
      const summary = extracted
        .map((m, i) => `${i + 1}. [${m.kind}] ${m.content}${m.tags.length ? ` (${m.tags.join(", ")})` : ""}`)
        .join("\n");
      return {
        content: [{
          type: "text" as const,
          text: `Would extract ${extracted.length} memories (dry-run):\n\n${summary}`,
        }],
      };
    }

    const saved = extracted.map((m) => store.save({
      content: m.content,
      kind: m.kind,
      tags: m.tags,
      project,
    }));

    return {
      content: [{
        type: "text" as const,
        text: `Extracted and saved ${saved.length} memories${project ? ` (project: ${project})` : ""}.\n\nIDs: ${saved.map((s) => "#" + s.id).join(", ")}`,
      }],
    };
  };
}
