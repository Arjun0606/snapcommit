/**
 * Waitlist signup proxy. Posts to a Supabase Edge Function (or stores in
 * Supabase directly via service-role key). For v0, it's a thin pass-through.
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

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        tools: Array.isArray(body.tools) ? body.tools : [],
        pain: typeof body.pain === "string" ? body.pain.slice(0, 1000) : "",
        willing_to_pay: typeof body.willingToPay === "string" ? body.willingToPay : "",
        source: typeof body.source === "string" ? body.source.slice(0, 500) : null,
      }),
    });
    const out = await res.json().catch(() => ({}));
    return NextResponse.json(out, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
