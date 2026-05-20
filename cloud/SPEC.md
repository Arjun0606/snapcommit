# Snapcommit Cloud — API Spec (Supabase edition)

The cloud is one Supabase project. It provides:

1. **Auth** — Supabase Auth handles magic-link emails and session JWTs.
2. **Database** — Postgres with RLS, holding accounts + tokens + usage.
3. **Edge Functions** — Deno-based serverless endpoints.
4. **Email** — Supabase's built-in Resend integration for auth emails.

We never store user content. Edge Functions proxy extraction to GPT-5 Nano (failover: Gemini 2.5 Flash) using our keys.

## Project structure

```
cloud/supabase/
├── config.toml                    # Supabase project config
├── migrations/
│   └── 20260101000000_init.sql    # users, api_tokens, usage_monthly, extraction_log, demo_usage
└── functions/
    ├── _shared/
    │   ├── auth.ts                # token verify, quota helpers, JSON helpers
    │   └── extract.ts             # OpenAI/Gemini extraction
    ├── extract/                   # POST /v1/extract (paid)
    ├── demo-extract/              # POST /v1/demo-extract (anonymous, IP rate limited)
    ├── account/                   # GET /v1/account
    ├── portal/                    # POST /v1/portal (Dodo customer portal)
    ├── delete-account/            # POST /v1/delete-account
    └── dodo-webhook/              # POST /v1/dodo-webhook (subscription events)
```

## Endpoints

### `POST /functions/v1/extract`

Authenticated extraction. Requires active subscription (tier !== 'inactive') and remaining quota.

**Headers**: `Authorization: Bearer sct_live_xxx`
**Body**: `{ "content": "...max 8000 chars..." }`

**Response 200**:
```json
{
  "memories": [{ "content": "...", "kind": "decision", "tags": ["..."] }],
  "usage": { "used_this_month": 47, "monthly_quota": 200 }
}
```

**Response 402**: `{ "error": "quota exceeded", "upgrade_url": "..." }` (also when `tier === 'inactive'`)
**Response 401**: `{ "error": "invalid token" }`

### `POST /functions/v1/demo-extract`

**Anonymous**. The "try it" widget on snapcommit.com. Rate limited to 3 calls per IP per UTC day. Caps content at 4,000 chars.

**Body**: `{ "content": "..." }`
**Response 200**: `{ "memories": [...], "demo_remaining": 2 }`
**Response 429**: `{ "error": "demo limit reached", "message": "Subscribe at..." }`

### `GET /functions/v1/account`

Returns tier, quota, and current month's usage.

**Headers**: `Authorization: Bearer sct_live_xxx`
**Response 200**: `{ "email", "tier", "monthly_quota", "used_this_month" }`

### `POST /functions/v1/portal`

Returns a one-time Dodo customer portal URL.

**Headers**: `Authorization: Bearer sct_live_xxx`
**Response 200**: `{ "url": "https://billing.dodopayments.com/..." }`

### `POST /functions/v1/delete-account`

Two-step deletion.

**Headers**: `Authorization: Bearer sct_live_xxx`
**Body**: `{ "confirm": false }` → sends confirmation email → `{ "state": "email_sent" }`
**Body**: `{ "confirm": true }` (called from the email link after Supabase Auth verifies) → cancels Dodo subscription, deletes auth user (cascade removes profile, tokens, usage) → `{ "state": "deleted" }`

### `POST /functions/v1/dodo-webhook`

Verifies HMAC signature against `DODO_WEBHOOK_SECRET`, handles:

| Event | Action |
|-------|--------|
| `subscription.created` | Create auth user (if missing), generate API token, email it |
| `subscription.updated` | Update tier + quota |
| `subscription.canceled` / `subscription.paused` | Set tier = inactive, quota = 0 |

The auth user creation uses Supabase Auth's `generateLink('magiclink')` which sends an email through their managed Resend integration. The redirect lands on `snapcommit.com/auth/callback?token=sct_live_...` which surfaces the token to the user.

## Onboarding flow (paid-only, demo-driven)

There is **no free tier in the cloud**. The free product is the open-source MCP server — local memory works without an account. The cloud is paid from the first call.

1. User lands on snapcommit.com → uses the live demo (anonymous, 3 calls/day per IP).
2. They click "Get Hobby" / "Pro" / "Studio" → Dodo Checkout (hosted by Dodo).
3. Dodo collects payment + tax, fires `subscription.created` webhook.
4. Worker creates Supabase Auth user, generates API token, sends magic-link email.
5. User clicks email link → `snapcommit.com/auth/callback?token=sct_live_xxx` displays the token.
6. User pastes into AI tool: *"Sign in to Snapcommit with token sct_live_xxx"*.
7. `snapcommit_login` stores it locally. Account active. Memory + extraction work.

## D1 → Postgres schema (new)

```sql
profiles      (id, email, tier, monthly_quota, dodo_customer_id, ...)
api_tokens    (id, user_id, token_hash, token_prefix, created_at, revoked_at)
usage_monthly (user_id, year_month, used)  -- atomic increment via RPC
extraction_log (user_id, ts, model, input_tokens, output_tokens, ok)
demo_usage    (ip, day, count)  -- per-IP anonymous demo rate limit
```

`extraction_log` and `usage_monthly` are aggregates only. No row contains user content.

## Deploy (solo dev one-liner)

```bash
# Sign up at supabase.com (free), create new project "snapcommit"
# Install CLI: brew install supabase/tap/supabase

cd cloud/supabase

supabase login
supabase link --project-ref <your-project-ref>
supabase db push                          # runs the migration
supabase secrets set OPENAI_API_KEY=sk-... DODO_API_KEY=... DODO_WEBHOOK_SECRET=...
supabase functions deploy                 # deploys all 6 functions

# Done. Endpoints live at:
# https://<project-ref>.supabase.co/functions/v1/extract
# https://<project-ref>.supabase.co/functions/v1/demo-extract
# ...
```

In MCP server config (or env): point `SNAPCOMMIT_API` at `https://<project-ref>.supabase.co/functions/v1`.

## Costs

- **Free Supabase tier**: 500MB DB, 2GB bandwidth, 50K MAU, 500K Edge Function invocations/month. Covers the first few thousand users.
- **Pro Supabase tier ($25/mo flat)**: 8GB DB, 100GB bandwidth, 250K MAU, 2M Edge Function invocations. Covers up to ~$100K MRR.
- **OpenAI/Anthropic/Gemini costs**: variable; see margin table below.

| Tier | Quota | LLM cost | Dodo fee | Net | Margin |
|------|-------|----------|----------|-----|--------|
| Hobby $9 | 200 | ~$0.10 | ~$0.50 | $8.40 | ~93% |
| Pro $29 | 2,000 | ~$1.00 | ~$1.50 | $26.50 | ~91% |
| Studio $129 | 10,000 | ~$5.00 | ~$6.00 | $118.00 | ~91% |

Plus demo cost: 3 calls/IP × ~$0.0005/call. At 1,000 unique IPs/day = ~$45/month in acquisition.

## Why Supabase (vs Cloudflare Workers + D1 + Resend)

- One dashboard, one CLI, one bill, one mental model
- Auth + email built-in (we never write magic-link code)
- Postgres > SQLite for debugging at scale
- Row-level security is one-click
- `supabase start` brings up the entire stack locally

The MCP server (client-side) doesn't care which backend lives at `SNAPCOMMIT_API`. If we ever need to migrate, the swap is one URL change.
