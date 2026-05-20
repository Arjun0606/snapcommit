/**
 * Signup proxy — forwards email to the snapcommit cloud worker, which:
 *   1. Creates a user row in D1 with a generated token
 *   2. Emails the token via Resend
 *   3. Returns 200
 *
 * In production this is just a thin pass-through. The cloud worker handles
 * the actual user creation so the site can stay a static-ish Next.js app.
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

  if (typeof body?.email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/v1/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: body.email }),
    });
    if (!res.ok) {
      const upstream = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: upstream.error ?? `signup ${res.status}` },
        { status: res.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
