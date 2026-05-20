# Snapcommit — Build Rules (Locked)

Memory layer for AI tools. One MCP server, works across Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf, and 25+ other MCP clients. Genuinely local-first. Open source MIT.

These rules are non-negotiable. Every decision passes through them.

## The product principle

**Make copy-paste obviously stupid.**

If a feature doesn't make the markdown-context workaround look primitive in comparison, it's not in v1. The bar is "10x better than maintaining your own .md file," not "slightly better."

## The architecture principle (locked May 2026)

**We are a tool enabler, not a database. We don't even pick the sync protocol.**

The memory file is a single SQLite or JSON file at a path the user controls. The user puts that file wherever they want it synced:

| User wants | They put the file in | Result |
|---|---|---|
| Single-device, offline | `~/.snapcommit-mcp/memories.db` (default) | Fast, private, no sync |
| Sync across own devices | `~/Library/CloudStorage/iCloud Drive/snapcommit/memories.db` | iCloud auto-syncs to all their Apple devices |
| Cross-platform sync | `~/Dropbox/snapcommit/memories.db` (or OneDrive, Google Drive) | Their existing cloud sync handles it |
| Share with team | Any shared cloud folder (Dropbox shared, iCloud Shared, Google Drive shared) | Permissions handled by the cloud provider |
| Version history | A folder backed by git, or `~/Library/CloudStorage/Dropbox/snapcommit/` with Dropbox file history | Free time-travel via the provider |
| Notion-as-UI for browsing | Optional snapcommit_notion_setup adapter (one-way mirror) | Power-user feature, not required |

**We do not build sync. We do not build sharing. We do not build a cloud.** The user's existing cloud provider (which they already pay for and trust) handles all of it. Our job is to write to the file path they give us.

This kills, completely:
- Cloud sync infrastructure to build
- User accounts, login flows, password resets
- Storage costs that scale with users
- Backups to manage
- Security audits / SOC2 / GDPR theater
- Cross-device conflict resolution (cloud provider handles it)
- Team permission UI (cloud provider handles it)
- Vendor lock-in concern (data is just a file, user owns it)

The Plaid pattern, taken further: we are not even an opinionated wire. The user picks the wire.

## What the user does

- **Single device**: nothing. Defaults work.
- **New device**: install Snapcommit, set `SNAPCOMMIT_STORAGE` env var to the cloud-folder path, done.
- **Team sharing**: put the file in a shared cloud folder, teammates set the same path. Done.
- **Backup**: their cloud provider auto-backs it up.
- **Privacy**: nothing leaves their machine unless they put it in cloud storage themselves.

## Pricing (locked)

**Target**: $100K MRR ceiling, solo-sustainable, consistent revenue (not lottery).

**Free tier (forever, MIT)**:
- Local SQLite memory store
- All 7 local memory tools
- Auto-installer for 30+ MCP clients
- Web dashboard (local)
- Notion sync (user's own workspace)
- Keyword/FTS5 search
- Regex-based extraction

**Tiered SaaS via Dodo Payments. We provide the AI compute. We never store content.**

Architecture:
- User content lives in user's file (local + their cloud folder)
- When user invokes a Pro feature, the local MCP server POSTs to our API
- Our API proxies to OpenAI/Anthropic using OUR key, counts usage, returns
- Content is processed in-flight, never persisted server-side
- Only metadata logged (user_id, timestamp, model, token count, success) — never prompts or content

**Free** — $0/mo
- All local memory tools (save/recall/list/projects/update/delete/export)
- File-based storage in user's chosen path (local or cloud folder)
- Notion adapter
- All 30+ MCP clients supported
- **5 smart-extraction calls/month** (taste of Pro)
- Keyword search

**Hobby** — $9/mo
- Everything in Free
- **200 smart-extraction calls/month**
- Semantic search
- Auto-deduplication
- Email support (best-effort)

**Pro** — $29/mo
- Everything in Hobby
- **2,000 smart-extraction calls/month**
- Memory consolidation (auto-condense related memories)
- Conflict detection across devices
- Priority response on issues

**Studio** — $99/mo
- Everything in Pro
- **10,000 smart-extraction calls/month** (fair use)
- Custom extraction prompts
- Early access to new features

**What we DON'T charge for**:
- Storage (file the user owns)
- Sync (user's cloud provider does it)
- Sharing (user's cloud provider does it)
- Memory count (no arbitrary limits — they own the file)
- Self-hosted Notion adapter
- Number of devices

**Math (autopilot via Dodo + tiered SaaS)**:
- Cost per extraction (Anthropic Haiku, ~3K in / 500 out): ~$0.0044
- Hobby $9: ~$0.88 cost @ 200 calls = ~90% margin
- Pro $29: ~$8.80 cost @ 2000 calls = ~70% margin
- Studio $99: ~$44 cost @ 10000 calls = ~55% margin
- Dodo Payments merchant of record = handles tax compliance globally
- Cloudflare Workers/D1 for usage tracking = free tier covers tens of thousands of users
- To hit ~$100K MRR: blended ~5,500 paying users across tiers (achievable)

**Why this is autopilot**:
- One API key (ours) instead of N user keys to manage
- We process, we don't store → minimal compliance burden
- Stripe-like subscriptions through Dodo (tax handled)
- Usage caps make Studio profitable even for power users
- Free tier broad (no AI-feature lock-in for early users), Pro-tier upsell natural when they want more extraction

## Hard constraints

1. **Solo-buildable.** No feature requires a team, co-founder, or hire. If a path can't be shipped by one person in one weekend (per feature), it's wrong.
2. **MCP-first.** v1 is an MCP server only. No Chrome scraping, no DOM parsing, no fragile site integrations.
3. **Genuinely local-first.** Data lives on the user's machine by default. We do not lie about this like OpenMemory does. Cloud sync is opt-in, paid, encrypted.
4. **No team/enterprise in v1.** Single user, single device, single brain. Multi-device sync is v2 maybe. Team plans don't exist.
5. **One price + free OSS.** $9/mo Pro for cloud sync. Free open source for local-only forever. No team tier, no enterprise tier.
6. **Open source from day one.** MIT licensed. Public repo before code is finished. Stars accumulate during build.
7. **Beautiful DX.** Linear/Resend grade. If the docs are ugly or the README is generic, fix it before shipping.
8. **No invented pain.** Every feature traces to a validated user complaint from Reddit/HN/Indie Hackers data we already gathered.
9. **Ship in 4-5 weeks.** Time-box aggressively. Cut scope, never extend timeline.
10. **No team-collaboration features ever.** Founder explicitly said they cannot maintain that complexity solo. Shared workspaces, RBAC, audit logs — all forbidden in v1, v2, v3.

## What's IN v1

1. MCP server with tools: `save_memory`, `recall_memory`, `list_memories`, `list_projects`, `update_memory`, `delete_memory`, `export_memories`
2. **Local SQLite** as the canonical working store (`~/.snapcommit-mcp/memories.db`)
3. **Optional Notion sync** — user brings their own Notion token, we sync to a database in their workspace
4. `npx @snapcommit/install` — auto-detects Claude Code / Cursor / VS Code / Claude Desktop / Cline / Windsurf
5. Simple web dashboard (Next.js) for browse/search/edit memories
6. Project-aware routing (auto-detect from git remote / CWD)
7. Captures decisions AND rejections (not just facts)

## What's OUT of v1 (and probably out of v2)

- ❌ **Our own cloud sync** — Notion is the sync layer, we don't host it
- ❌ **Paid storage tier** — never charging for data we don't own
- ❌ Team workspaces in OUR product (Notion handles team sharing for free)
- ❌ Stripe / billing — no paid tier in v1
- ❌ Chrome extension (v3 maybe)
- ❌ Mobile app
- ❌ Voice mode
- ❌ Web-only AI tool support (ChatGPT.com, Claude.ai web) — they don't speak MCP yet
- ❌ Custom model fine-tuning
- ❌ Anything requiring training data collection
- ❌ Auto-update without explicit user consent (no OpenMemory-style deception)
- ❌ Sync targets other than Notion in v1 (Obsidian/Linear/Airtable maybe later)

## Tech stack (locked)

- TypeScript, ESM modules
- `@modelcontextprotocol/sdk` — official MCP SDK
- `better-sqlite3` — local storage (sync, fast, simple, file-based)
- `@notionhq/client` — Notion API (optional sync target, user brings token)
- `zod` — schema validation
- `@xenova/transformers` — local embeddings if needed (no API cost)
- Node 20+ (let LTS handle compatibility)
- Build: `tsc` → ESM output
- Test: `vitest`
- Lint: just `prettier`, no eslint complexity for now

For dashboard (separate package later):
- Next.js 15 App Router
- Tailwind
- shadcn/ui for components

## Anti-patterns (do not do these)

- ❌ Adding configuration options "for flexibility" — pick the right default
- ❌ Inventing memory abstractions when the use case is concrete
- ❌ Premature multi-tenancy
- ❌ Custom protocols — use MCP as designed
- ❌ Writing a database — use SQLite
- ❌ "Enterprise-ready" features before any users exist
- ❌ Verbose error handling for impossible cases
- ❌ Comments that explain what the code does (only why, only when surprising)
- ❌ Telemetry that captures user content
- ❌ Defaults that send data anywhere by default

## What I (Claude) should do when working on this repo

- Read this file before any change
- Prefer Edit over Write for existing files
- Don't add scope creep. If a feature isn't on the v1 list, don't add it.
- Test that the MCP server actually works in Claude Code locally before claiming done
- If a feature is hard to explain in one sentence, it's probably wrong

## Validation lens — apply on every decision

- Does this make copy-paste look stupid?
- Can solo Arjun ship this in one weekend?
- Does this validate against the Reddit pain data?
- Is the user data still on their machine by default?
- Would a Linear or Resend engineer ship this UX?

If any answer is no, change the decision.
