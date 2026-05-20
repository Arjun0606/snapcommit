# Snapcommit Cloud — API Spec

The cloud is a thin gateway. It:

1. Authenticates users via API token
2. Counts monthly extraction calls per user
3. Proxies AI extraction to Anthropic/OpenAI using our own keys
4. **Never stores user content** — request body is in-flight only
5. Stores only metadata (user_id, timestamp, model, token count, success)

Designed for a single Cloudflare Worker + D1 database. Free tier covers tens of thousands of users.

## Endpoints

### `POST /v1/extract`

Extract structured memories from a conversation chunk.

**Headers**: `Authorization: Bearer <token>`

**Body**:
```json
{ "content": "raw conversation text (max 8000 chars)" }
```

**Response 200**:
```json
{
  "memories": [
    {
      "content": "Use SQLite over Postgres for local-first storage",
      "kind": "decision",
      "tags": ["storage", "architecture"]
    }
  ],
  "usage": { "used_this_month": 47, "monthly_quota": 200 }
}
```

**Response 401**: `{ "error": "invalid token" }`
**Response 402 / 429**: `{ "error": "quota exceeded", "upgrade_url": "https://snapcommit.com/pricing" }`

**Server logic**:
1. Verify token → user row in D1
2. Check `used_this_month < monthly_quota`. If exceeded → 402.
3. Increment usage counter (atomic).
4. POST to Anthropic Messages API with `claude-3-5-haiku-20241022` and our `ANTHROPIC_API_KEY`.
5. Parse model output as JSON array. Discard everything else.
6. Return memories + usage. **Never log the request body or response content.**

### `GET /v1/account`

Return tier, quota, and used count for the authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "email": "user@example.com",
  "tier": "pro",
  "monthly_quota": 2000,
  "used_this_month": 47
}
```

### `POST /v1/auth/signup`

Create a new account. Generates API token, returns it once.

**Body**:
```json
{ "email": "user@example.com" }
```

**Response 200**:
```json
{
  "token": "sct_live_xxxxxxxxxxxxxxxx",
  "tier": "free",
  "monthly_quota": 5
}
```

(In production, this is a magic-link email flow. For v0 we can ship a simple form on snapcommit.com.)

### `POST /v1/account/portal`

Generate a one-time URL to the user's Dodo customer portal. Hand to client; client opens in browser.

**Headers**: `Authorization: Bearer <token>`

**Response 200**: `{ "url": "https://billing.dodopayments.com/portal/..." }`

Worker logic: look up `dodo_customer_id` for the user, call Dodo's `portal/create-session` API, return the URL.

### `POST /v1/account/delete`

Start (or finalize) account deletion.

**Headers**: `Authorization: Bearer <token>`

**Body**: `{ "confirm": true }` or `{ "confirm": false }`

If `confirm === false`: generate a JWT signed deletion-confirmation token, email it via Resend (link: `https://snapcommit.com/delete?token=...`), return `{ "state": "email_sent" }`.

If `confirm === true` (called from the email confirmation page after JWT verify, OR with the magic phrase from MCP): cancel Dodo subscription, delete all user-scoped rows, return `{ "state": "deleted" }`.

### Dodo Payments webhook

Handles tier upgrades, cancellations, and payment failures (dunning).

**`POST /v1/webhooks/dodo`** with HMAC-signed payload from Dodo.

Events we handle:

| Event | Action |
|-------|--------|
| `subscription.created` | Upsert user row → set `tier` and `monthly_quota` |
| `subscription.updated` | Update user's tier/quota if subscription tier changed |
| `subscription.canceled` | At billing-period end: downgrade user to `free` tier |
| `payment.failed` | Mark subscription as `past_due` (still active for grace period) |
| `subscription.past_due` | Email user (via Resend) — payment failed, retrying |
| `subscription.paused` | Downgrade to free immediately after final retry fails |

**Dodo handles its own dunning emails:**
- Day -7 before renewal: reminder email (handled by Dodo)
- Day 0: charge attempt
- Days +3, +7, +14: automatic retry + reminder email (Dodo)
- Day +21: subscription paused → webhook fires → we downgrade

We don't run our own cron. We don't send our own billing emails. Dodo's standard merchant-of-record flow covers it.

### Upgrade nudge endpoint (optional)

**`POST /v1/nudge/dismiss`** — when user clicks "remind me later" on an upgrade prompt, store dismissal so we don't nag too often. Not v1 critical.

## D1 schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- uuid
  email TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,      -- bcrypt(api_token)
  tier TEXT NOT NULL DEFAULT 'free',
  monthly_quota INTEGER NOT NULL DEFAULT 5,
  dodo_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE usage_monthly (
  user_id TEXT NOT NULL,
  year_month TEXT NOT NULL,      -- e.g. '2026-05'
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year_month)
);

CREATE TABLE extraction_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  ok INTEGER NOT NULL              -- 0 or 1
);
```

**No table stores `content`. Ever.** Logs are metadata only.

## Model strategy

| Role | Model | Pricing (May 2026) | Why |
|------|-------|---------------------|-----|
| Primary | **GPT-5 Nano** | ~$0.10/M in, $0.40/M out | Best structured-output quality at this price tier; OpenAI's response_format=json_object is reliable |
| Failover | **Gemini 2.5 Flash** | ~$0.075/M in, $0.30/M out | 97.1% quality on extraction benchmarks; cheaper than primary |
| Studio opt-in | **Claude Haiku 4.5** | ~$0.80/M in, $4/M out | Highest extraction nuance when needed; 8x more expensive |

Per-extraction cost (~3K input + 500 output tokens):
- GPT-5 Nano: ~$0.0005
- Gemini 2.5 Flash: ~$0.0004
- Haiku 4.5: ~$0.0044

## Costs (per user/month estimates with GPT-5 Nano primary)

| Tier | Quota | Model cost | Dodo fee | Net @ price | Margin |
|------|-------|------------|----------|-------------|--------|
| Free | 5 | $0.0025 | $0 | -$0.0025 | acquisition |
| Hobby $9 | 200 | $0.10 | ~$0.50 | $8.40 | ~93% |
| Pro $29 | 2,000 | $1.00 | ~$1.50 | $26.50 | ~91% |
| Studio $129 | 10,000 | $5.00 | ~$6.00 | $118.00 | ~91% |

To hit $100K MRR: blended ~3,500-5,500 paying users (depending on tier mix). Solo-sustainable forever at these margins.

## Stack

- **Cloudflare Worker** — handles all endpoints. Free tier: 100K req/day.
- **Cloudflare D1** — accounts + usage. Free tier: 5M reads/day, 100K writes/day.
- **Cloudflare KV** — optional rate-limit counters.
- **Dodo Payments** — billing + tax + subscription lifecycle.
- **Resend** — magic-link signup emails ($0 up to 3K/mo).
- **Anthropic API key** — single org-level key. Cost scales with usage.

Total infra cost at <10K users: **~$0/month**. At >10K users: minimal Cloudflare paid plan.

## Implementation order

1. D1 database + schema deployed
2. Worker route `/v1/auth/signup` — basic email-token flow
3. Worker route `/v1/account` — read tier/usage
4. Worker route `/v1/extract` — the money endpoint
5. Dodo Payments product setup + webhook handler
6. Resend magic-link email
7. snapcommit.com signup page (Next.js, can reuse dashboard package)

Estimated total: 1 week solo.
