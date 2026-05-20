/**
 * Thin proxy from the landing-page demo widget to the Supabase Edge Function.
 * Forwards the client IP so the Function can rate-limit per IP.
 */
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.SNAPCOMMIT_API ?? "https://api.snapcommit.com";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  try {
    const res = await fetch(`${API_BASE}/demo-extract`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify(body),
    });
    const out = await res.json();
    return NextResponse.json(out, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
