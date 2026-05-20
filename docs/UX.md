# Snapcommit — full user experience

The complete journey: how a user discovers Snapcommit, signs up, uses it across every realistic situation, hits limits, pays, cancels, deletes, and recovers — and what we guarantee about their data at every step.

---

## 1. The onboarding journey

There are three plausible entry points. All converge on the same end state: AI tools have memory, file is on the user's machine, free tier is active.

### Path A — "Discovered via AI tool" (most common)

1. User reads about Snapcommit on HN / Twitter / a friend mentions it.
2. They run **one command**:
   ```
   npx @snapcommit/install
   ```
3. Installer auto-detects Claude Code, Cursor, Claude Desktop, Cline, Windsurf, Codex CLI, etc., and writes the MCP config for each.
4. User restarts their AI tool.
5. They use the AI normally. The AI sees `save_memory`, `recall_memory`, etc. as available tools.
6. First time the AI calls `save_memory` — works. Local SQLite file created at `~/.snapcommit-mcp/memories.db`. **Zero auth needed for local memory.**
7. User keeps working. After a while they ask the AI to "extract the key decisions from this conversation."
8. AI calls `snapcommit_smart_extract` → response: *"Not signed in. Get a free account at snapcommit.com/signup (3 free extractions). Then run snapcommit_login with your token."*
9. User visits snapcommit.com/signup, enters email.
10. Token arrives by email via Resend (typically <30s).
11. User pastes token into their AI: *"Sign in to Snapcommit with token sct_live_..."*
12. AI calls `snapcommit_login`. Local config stores token. Tier cached.
13. AI calls `snapcommit_smart_extract` again — succeeds. Response includes: *"Saved 4 memories. Usage: 1/3 this lifetime."*

### Path B — "Discovered via the landing page"

1. User lands on snapcommit.com.
2. Reads hero, why, how, compare table, pricing.
3. Clicks "Start free" → /signup.
4. Enters email → token sent.
5. Instructions on confirmation screen: *"Now run `npx @snapcommit/install` in your terminal, then sign in with `Sign in to Snapcommit with token sct_live_...`"*.
6. Same end state as Path A.

### Path C — "Existing user, new device"

1. User already has account + token.
2. On new device: `npx @snapcommit/install`.
3. In AI: *"Sign in to Snapcommit with token sct_live_..."*.
4. In AI: *"Move Snapcommit to iCloud"* (or Dropbox / OneDrive / Google Drive).
5. iCloud syncs the memory file from the original device.
6. Memories appear, tagged with the original device's label.
7. New writes get tagged with the new device's label.

---

## 2. Every realistic use case

### 2.1 Free local-only user (forever)

- Doesn't sign up at all.
- Uses every local tool unlimited: save, recall, list, projects, update, delete, export, Notion sync.
- Never calls `snapcommit_smart_extract`.
- We don't know they exist. Cost: $0 forever.
- This is fine. The free local product is genuinely useful and we don't try to manipulate them.

### 2.2 Solo dev, single project, single device

- Signs up, uses 3 free extractions to taste.
- Upgrades to Hobby ($9/mo, 200 extractions).
- Lives within Hobby quota indefinitely.
- Bills cleanly via Dodo. Tax handled per their country.

### 2.3 Solo dev, multiple devices

- One subscription, multiple devices.
- Each device runs `snapcommit_use_icloud` (or chosen provider).
- Their cloud provider syncs `memories.db` across machines.
- Each memory carries `source_device` so they can audit which laptop made each call.
- Quota is per-account, not per-device. 200 extractions/mo across all their devices.

### 2.4 Solo dev, multiple projects in one Claude Code

- Switches between snapcommit, cabbage, kalshi projects.
- Snapcommit auto-detects project from git remote / CWD on each save.
- `recall_memory` auto-scopes to the current project. To search across all: `recall_memory all_projects=true`.
- One Snapcommit account, one memory file, projects cleanly separated by `project` field.

### 2.5 Solo dev running multiple AI agents (Claude Code + Cursor + Codex)

- All three agents share one local memory file.
- Each memory tagged with `source_agent` (claude-code, cursor, codex).
- All agents see all memories — they collaborate via the shared store.
- Optional: filter `list_memories source_agent="cursor"` to audit one tool's decisions.

### 2.6 Team — handover

- Original dev shares snapcommit folder via Dropbox shared folder (or iCloud Shared, Google Shared).
- New dev installs Snapcommit, points at the shared path.
- They see all existing memories with original dev's device labels intact.
- Both can write going forward. Cloud provider handles conflicts (last-write-wins on the file).
- Note: SQLite over shared cloud sync is fine for low write concurrency. For high-concurrency teams, prefer the Notion adapter as the canonical store.

### 2.7 Team — sharing across an org

- Org buys multiple Snapcommit subscriptions (one per dev — no team plan; per-seat is simpler).
- Each dev manages their own quota.
- Shared memory file lives in a shared Dropbox/iCloud/etc. folder.
- This sidesteps team-plan complexity entirely.

### 2.8 Power user crosses 80% quota

- During a normal smart_extract response, an inline message appears:
  > *"Heads up: 39 extractions left this month. Pro tier (2000/mo, $29) at snapcommit.com/pricing if you want headroom."*
- They can ignore. No nag fatigue — only fired once per pricing-tier threshold.

### 2.9 Power user crosses 95% quota

- The nudge sharpens:
  > *"⚠ 9 extractions left this month. Upgrade to Pro at snapcommit.com/pricing"*

### 2.10 User hits quota (100%)

- `snapcommit_smart_extract` call returns:
  > *"You're out of extractions this month. Upgrade to Pro ($29/mo, 2000 calls) at https://snapcommit.com/pricing"*
- All other local tools work normally. Save/recall/list/export — uninterrupted.
- User can keep working manually; AI just can't auto-extract.
- Quota resets on the 1st of next month (for paid tiers). Free is lifetime — no reset.

### 2.11 Subscription renewal — happy path

- Day -7 before renewal: Dodo sends reminder email.
- Day 0: Dodo charges the saved card. Success. New month's quota fresh.
- User notices nothing.

### 2.12 Subscription renewal — payment fails

- Day 0: charge fails. Dodo enters dunning.
- User still has Pro access during grace period (~21 days).
- Dodo sends polite reminder emails at day +3, +7, +14 (we do nothing here — merchant of record).
- Day +21: subscription paused. Dodo fires `subscription.paused` webhook to our cloud.
- Cloud worker updates `tier` to `free` in D1.
- Next `snapcommit_smart_extract` call returns:
  > *"Your Pro subscription lapsed (last payment failed). Free tier active. Update payment method at https://snapcommit.com/billing to restore."*

### 2.13 User downgrades

- They visit Dodo customer portal (link from `snapcommit_account_status` or `snapcommit_open_billing`).
- Change subscription from Pro → Hobby.
- Dodo fires `subscription.updated` webhook.
- Cloud worker updates tier + quota in D1.
- Next MCP call shows new quota inline.

### 2.14 User cancels

- Customer portal → cancel subscription.
- Subscription marked `cancel_at_period_end=true`.
- They KEEP Pro features until end of current billing cycle.
- After period: webhook fires → tier set to `free`.
- All their local memories untouched.
- Their cloud row stays so they can resubscribe with same email later.

### 2.15 User deletes account

- Runs `snapcommit_delete_account` in their AI tool.
- Tool replies: *"This deletes your account, cancels any subscription, and removes everything on our servers. Local memories on your machine are untouched. A confirmation email will be sent to your address. Click within 24h to confirm."*
- Confirmation email sent via Resend with a signed link.
- User clicks → cloud worker:
  - Cancels active Dodo subscription immediately.
  - Deletes user row from `users`.
  - Deletes their rows from `usage_monthly` and `extraction_log`.
- Returns: *"Account deleted. Your local memories are still on your disk at /path. The MCP server still works in Free mode. To delete your local memories, delete the file yourself."*

### 2.16 User loses their token

- Signup page has *"Lost your token?"* link.
- Enters email → Resend sends a fresh token via magic-link.
- Old token revoked server-side.
- They re-run `snapcommit_login` with the new token.

### 2.17 User wants to migrate storage providers

- Was using local. Wants iCloud.
- Runs `snapcommit_use_icloud`. We move the path. They restart AI client.
- Files at new path. Old path file remains (we don't delete to avoid data loss).
- They can later `rm ~/.snapcommit-mcp/memories.db` if they want.

### 2.18 User wants Notion-as-mirror too

- Already has local file working.
- Runs `snapcommit_notion_setup token=... parent_page=...`.
- Snapcommit Memory database created in their Notion workspace.
- Runs `snapcommit_notion_sync` periodically. Local stays canonical; Notion is the mirror.

### 2.19 Free tier exhausted, doesn't want to pay

- Hits 3 lifetime extractions used.
- All local features keep working forever.
- Smart_extract returns:
  > *"Free quota exhausted. Local memory still works fully — use `save_memory` directly when you want to remember something. Upgrade to Hobby ($9/mo, 200/mo) at snapcommit.com/pricing if you want auto-extraction."*

### 2.20 User wants to export everything

- `snapcommit_export_memories format=json` or `format=markdown`.
- Returns full data inline. They copy/save wherever.
- Data portability is guaranteed — we never hold their content hostage.

---

## 3. Payment reminders — exact behavior

All payment-related emails are sent by Dodo Payments (merchant of record). We do not run our own dunning system.

| Event | When | Who sends | Action |
|-------|------|-----------|--------|
| Renewal heads-up | Day -7 before renewal | Dodo | Email: "Your subscription renews on X" |
| Successful renewal | Day 0 | Dodo | Receipt email |
| Failed payment #1 | Day 0 | Dodo | "We couldn't charge — please update payment" |
| Retry + reminder | Day +3 | Dodo | Same content, another attempt |
| Retry + reminder | Day +7 | Dodo | Same content, another attempt |
| Retry + reminder | Day +14 | Dodo | Same content, final attempt |
| Subscription paused | Day +21 | Dodo | "Your subscription is paused" → webhook fires → we downgrade to Free |
| User can resume | Anytime | n/a | User updates payment in Dodo portal → subscription reactivates → webhook updates tier |

Inside the MCP server: usage nudges (80% / 95% / 100%) appear inline in every `snapcommit_smart_extract` response. Not email — just visible in their AI's reply.

---

## 4. Limit-reached handling — exact behavior

### Server-side (in the Cloudflare Worker)

```typescript
if (used >= user.monthly_quota) {
  return json({
    error: "quota exceeded",
    upgrade_url: "https://snapcommit.com/pricing"
  }, 402);  // 402 Payment Required
}
```

### Client-side (in the MCP server's smart_extract tool)

When server returns 402, the tool returns this content to the AI:
```
Extraction failed: Monthly quota exceeded.

You're out of smart-extraction calls for this month.
Upgrade: https://snapcommit.com/pricing
Free tier: 3 lifetime. Hobby $9: 200/mo. Pro $29: 2000/mo. Studio $129: 10000/mo.
```

### What the user can still do at 100%

| Action | Status |
|--------|--------|
| Local save_memory | ✅ unchanged |
| Local recall_memory | ✅ unchanged |
| Local list, projects, update, delete, export | ✅ unchanged |
| Notion sync | ✅ unchanged |
| Cloud presets (iCloud / Dropbox / etc.) | ✅ unchanged |
| snapcommit_smart_extract | ❌ blocked until reset or upgrade |
| snapcommit_account_status | ✅ shows tier + quota with upgrade nudge |

### When the quota resets

- Free tier: never resets (3 lifetime). They upgrade or stay at 3.
- Hobby / Pro / Studio: resets on the 1st of each month at 00:00 UTC.
- Implementation: `usage_monthly` table keyed on `(user_id, year_month)`. A new month auto-creates a new row at zero.

---

## 5. Cancellation — exact flow

The user can cancel from three surfaces:

### a) Their AI tool

```
> open my snapcommit billing
```

MCP tool `snapcommit_open_billing` returns a portal URL specific to their account. They click → Dodo customer portal opens in browser.

### b) snapcommit.com/account

Future: a tiny logged-in dashboard page that just embeds the Dodo portal. v1: not needed; tool above suffices.

### c) Email support

Last resort. We handle manually.

### What happens after cancel

1. Dodo marks subscription as `cancel_at_period_end=true`. They keep Pro features until end of cycle.
2. At period end: Dodo fires `subscription.canceled` webhook.
3. Cloud worker sets `users.tier = 'free'` and `users.monthly_quota = 3`.
4. Next MCP call from the user reflects free tier with appropriate nudge.
5. Their account row, login token, and email remain — they can resubscribe with the same identity.

---

## 6. Account deletion — exact flow

### Trigger

User runs:
```
> delete my snapcommit account
```

Or visits snapcommit.com and clicks "delete account" (future).

### Confirmation

The MCP tool replies:
```
This will delete your Snapcommit account.

What gets deleted (on our servers):
  • Your account row (email, token)
  • Usage history
  • Extraction-log metadata

What does NOT get deleted (yours forever):
  • Memories stored at /Users/you/.snapcommit-mcp/memories.db
  • Any cloud-synced copies in your iCloud / Dropbox / Notion
  • The MCP server itself (still works in Free mode)

A confirmation email is on its way to you@example.com.
Click the link within 24 hours to confirm. Without that click,
nothing happens.
```

### Confirmation email (via Resend)

```
Subject: Confirm Snapcommit account deletion

Click here to confirm: https://snapcommit.com/delete?token=signed-jwt

This link expires in 24 hours. If you didn't request this, ignore
this email — nothing will happen.
```

### After confirmation

Cloud worker:
1. Cancels active Dodo subscription (no refund unless requested).
2. `DELETE FROM extraction_log WHERE user_id = ?`
3. `DELETE FROM usage_monthly WHERE user_id = ?`
4. `DELETE FROM users WHERE id = ?`
5. Returns confirmation page: *"Your Snapcommit account is deleted. Your local memories are still on your machine. Thanks for trying us."*

### User's next MCP call

`snapcommit_account_status` returns:
```
Not signed in. Your token has been revoked.
Local memories at /path/to/memories.db continue to work.
Sign up again anytime at snapcommit.com/signup.
```

---

## 7. Data safety guarantees

Read these aloud. Every word matters.

### Local memories (the ones you care about)

- Live at `~/.snapcommit-mcp/memories.db` by default, or wherever you set storagePath.
- Never sent to our servers. Ever.
- We never have a copy. We never had a copy. We literally cannot have a copy.
- If you delete your account, they stay where they are.
- If we shut down tomorrow, they keep working forever (MCP server is open source, runs offline).

### Conversation content during AI extraction

- When you call `snapcommit_smart_extract`, the conversation chunk goes to our cloud (Cloudflare Worker).
- The Worker proxies it to GPT-5 Nano (or failover) using our API key.
- The result (memories array) comes back to your machine.
- **The Worker does not write the content to any database.** It logs only: `(user_id, timestamp, model, input_tokens, output_tokens, ok)`.
- Anthropic / OpenAI / Google have their own data-retention policies; we send a `no-train` header where the provider supports one.

### Metadata we keep

- `users` table: email, hashed token, tier, subscription state
- `usage_monthly`: monthly count per user (for quota enforcement)
- `extraction_log`: timestamp, model used, token counts, success/fail — never content

That's it. We don't track your IP, your device, your project names, what time you work, anything. The MCP server itself ships zero telemetry.

### Open source

- The MCP server (the thing on your machine) is MIT, full source on GitHub. Read every line.
- The cloud worker spec + source is in `cloud/` in the same repo. Run it yourself if you want.

### If we get acquired or shut down

- The MCP server keeps working forever (it's open source, runs locally).
- Notion / iCloud / Dropbox sync keeps working (it was never us).
- The cloud — smart_extract — would stop working. We commit to giving 90 days notice and exposing your usage history for export before shutdown.

---

## 8. What the user does NOT need to do

We solve these so the user doesn't have to think:

- ❌ Manage API keys for OpenAI / Anthropic — we proxy
- ❌ Worry about model selection — we route
- ❌ Set up cloud infrastructure — there isn't any from their side
- ❌ Configure auth providers — magic-link is enough
- ❌ Build conflict resolution — their cloud provider handles it
- ❌ Pay separately for storage — they use what they already pay for
- ❌ Compute taxes — Dodo's merchant of record covers globally

---

## 9. Reference: the full MCP tool list

| Tool | Auth required | Counts toward quota |
|------|---------------|---------------------|
| save_memory | no | no |
| recall_memory | no | no |
| list_memories | no | no |
| list_projects | no | no |
| update_memory | no | no |
| delete_memory | no | no |
| export_memories | no | no |
| snapcommit_status | no | no |
| snapcommit_storage_info | no | no |
| snapcommit_set_storage_path | no | no |
| snapcommit_use_icloud | no | no |
| snapcommit_use_dropbox | no | no |
| snapcommit_use_onedrive | no | no |
| snapcommit_use_google_drive | no | no |
| snapcommit_login | no (sets it) | no |
| snapcommit_account_status | requires token | no |
| snapcommit_logout | no | no |
| snapcommit_usage | requires token | no |
| snapcommit_smart_extract | requires token | **YES** |
| snapcommit_open_billing | requires token | no |
| snapcommit_delete_account | requires token | no |
| snapcommit_notion_setup | no | no |
| snapcommit_notion_sync | no | no |
| snapcommit_notion_status | no | no |
| snapcommit_notion_pull | no | no |

Everything except `smart_extract` is free, local, and works offline.
