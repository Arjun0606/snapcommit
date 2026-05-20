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

### Dodo Payments webhook

Handles tier upgrades / cancellations.

**`POST /v1/webhooks/dodo`** with HMAC-signed payload from Dodo.

When `subscription.created` or `subscription.updated`: look up customer email → update user's `tier` and `monthly_quota` in D1.

When `subscription.canceled`: downgrade user to `free` tier at end of billing period.

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

## Costs (per user/month estimates)

| Tier | Quota | Anthropic cost | Net @ price | Margin |
|------|-------|---------------|-------------|--------|
| Free | 5 | $0.02 | $0 - $0.02 | -- |
| Hobby $9 | 200 | $0.88 | $8.12 | 90% |
| Pro $29 | 2,000 | $8.80 | $20.20 | 70% |
| Studio $99 | 10,000 | $44.00 | $55.00 | 55% |

Assumes Anthropic Haiku at ~$0.0044 per extraction (3K input + 500 output tokens).

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
