# Show HN launch copy

## Title (under 80 chars)

Try a few — pick the one that lands.

1. `Show HN: Snapcommit – memory for your AI tools (local-first, MCP-native)`
2. `Show HN: Snapcommit – your AI never forgets, and we never see your data`
3. `Show HN: One MCP server, memory across Claude Code, Cursor, and 28 more clients`

Lean toward #1. It's specific and includes the technical hook (MCP) HN readers respond to.

## Body

Post in `Show HN`, link is snapcommit.com.

```
Hi HN — I'm Arjun, solo dev. I built Snapcommit because every new AI
session has me re-explaining the same project context. Reddit's #1 dev
complaint about AI tools is "they never remember me" — 91 hours a year
wasted per solo founder, per a recent analysis of 500 complaints.

Existing fixes are bad:
  - OpenMemory claims "local-first" but ships data to Mem0's cloud
  - Supermemory is server-side, holds your data
  - Mem AI burned $40M trying to be a database
  - Markdown files go stale and don't sync between tools

Snapcommit is one MCP server you install once. It works in Claude Code,
Cursor, VS Code, Claude Desktop, Cline, Windsurf, Codex CLI, Gemini CLI,
Zed, Continue, Warp — 30+ clients today.

Your memories live in a SQLite file on your machine. To sync across
devices or share with a team, you point Snapcommit at any cloud-synced
folder (iCloud / Dropbox / OneDrive / Google Drive / Notion). We never
build sync — your existing cloud provider does it.

The paid part is "smart extraction" — an LLM (GPT-5 Nano with Gemini
Flash failover) reads your conversation and pulls out decisions,
rejections (with reasons), preferences, facts, open questions. Content
is processed in-flight, never stored on our servers. Logs are metadata
only.

One differentiator I haven't seen elsewhere: it captures rejections —
what you tried and why it didn't work. So future sessions don't repeat
mistakes.

You can try it without signing up — there's a live demo on the landing
page (3 free per day per IP). Subscribe if it's useful: Hobby $9, Pro
$29, Studio $129.

Stack: TypeScript MCP server (MIT), Next.js landing, Supabase
(Postgres + Edge Functions). Dodo Payments for billing. ~95% margin,
solo-runnable.

GitHub: https://github.com/Arjun0606/snapcommit
Site: https://snapcommit.com

Happy to answer anything about MCP, the architecture, or the
"never-store-content" guarantee.
```

## Comment-ready answers (have these prepped)

**"What about Mem0's chrome extension?"**
> Real answer: their Chrome extension's marketing claims local-first but it ships data to Mem0's cloud servers — multiple reviews flag this. Snapcommit is genuinely local: the SQLite file is on your disk, we have no API into it.

**"How is this different from CLAUDE.md / .cursorrules?"**
> Those are static, manual, single-tool, and don't capture what you tried and rejected — only what you decided. Snapcommit auto-captures across every MCP client, syncs via your existing cloud, and remembers the rejections + reasoning so future sessions don't repeat mistakes.

**"Why not just give me an API key and let me bring my own model?"**
> I tried that architecture — turns out solo founders don't want to manage API keys for users (security), users don't want to manage API keys for themselves (friction). The proxy is simpler for everyone. Margins are healthy at the prices we charge.

**"Why no free tier?"**
> Local memory IS free, forever, MIT-licensed. What's paid is the LLM compute that happens through our cloud. A live demo on the homepage lets you try it without signing up. We didn't want to be the next AI startup that burns money giving away expensive LLM calls to drive-by signups.

**"What happens if you shut down?"**
> Local features keep working forever — MCP server is open source, fully offline-capable. Your Notion or cloud-folder copies are unaffected (we don't host them). Only smart-extraction stops. Terms commit us to 90 days' notice before any cloud shutdown.

**"Why MCP and not a browser extension?"**
> MCP-native means it works the same way across Claude Code, Cursor, Cline, Windsurf, all the CLI tools — without me writing 12 different scrapers and maintaining them as those tools change their UIs.

**"Bug in the demo: [...]"**
> Open issue on GitHub or ping me. Solo dev, will fix today.

## Launch day timing

- Post Tuesday-Thursday, 6:30 AM PT (HN traffic peaks 8-11 AM PT and you want a head start)
- Don't link from Twitter/Discord directly to your post URL (HN flags it)
- Engage with every comment for the first 8 hours — that's what keeps a post on the front page
