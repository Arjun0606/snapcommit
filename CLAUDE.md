# Snapcommit — Build Rules (Locked)

Memory layer for AI tools. One MCP server, works across Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf, and 25+ other MCP clients. Genuinely local-first. Open source MIT.

These rules are non-negotiable. Every decision passes through them.

## The product principle

**Make copy-paste obviously stupid.**

If a feature doesn't make the markdown-context workaround look primitive in comparison, it's not in v1. The bar is "10x better than maintaining your own .md file," not "slightly better."

## The architecture principle (locked Nov 2026)

**We are a tool enabler, not a database.**

Memories live in two places and we own neither:
1. **Local SQLite** on the user's machine (working memory, fast, default)
2. **The user's own Notion workspace** (optional, opt-in, their sync + share layer)

We do NOT run cloud infrastructure to store user data. Ever. This kills an entire category of cost, complexity, and trust problems in one move:

- No cloud sync infrastructure to build
- No Stripe to charge for storage
- No backups to manage
- No security audits / SOC2 / GDPR theater required
- No vendor lock-in concern for users (their data is in their Notion)
- No data breach risk on our side
- Notion already solves: cross-device sync, sharing with teammates, native mobile editing, search, history

The Plaid/Stripe pattern: we are the wire between the AI tool and the user's own storage. The user picks the storage.

What this means concretely:
- v1 = free, MIT, open source forever — no paid tier for storage
- Future revenue (if any) = optional managed/hosted convenience, or premium clients, never paid storage
- Sharing = "share your Notion database with your teammate" (Notion already does this perfectly)
- Cross-device = "log into Notion from your laptop and phone" (already solved)
- Backup = "your Notion workspace is the backup"

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
