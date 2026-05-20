# Snapcommit

**Local-first memory for your AI tools. Sync to your own Notion.**

One MCP server. Memory across Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf + 25 more clients. Your data lives on your machine. Optionally synced to your own Notion workspace for cross-device access and team sharing.

We are not a database. The user's Notion workspace is.

```bash
npx @snapcommit/install
```

That's it. Snapcommit detects your AI tools, wires itself into each, and now they remember across every session.

## Why

You re-explain your project to every new AI session. You re-state preferences. You re-paste context from one tool to another. Reddit's #1 dev complaint about AI tools is "they never remember me." 91 hours/year wasted per solo founder.

Existing fixes are bad:
- **OpenMemory** claims "local-first" but ships your data to Mem0's cloud
- **Supermemory** is server-side, $19/mo
- **Mem AI** burned $40M trying to be the database
- **Markdown files** go stale, don't sync, live in 4 different formats per tool

Snapcommit is **genuinely** local-first. Memories live in a SQLite file on your machine at `~/.snapcommit-mcp/memories.db`. If you want cross-device sync or to share with a teammate, you connect your own Notion workspace and we mirror to it. We host nothing.

## What it does

The MCP server exposes 11 tools your AI calls automatically:

### Memory (local SQLite, always-on)

| Tool | When |
|------|------|
| `save_memory` | When something is worth remembering: a decision, an approach tried and rejected (with reasons), a preference, a fact about the codebase, an open question |
| `recall_memory` | At session start, or when past context is relevant |
| `list_memories` | To browse without searching |
| `list_projects` | To orient across projects |
| `update_memory` | When a memory needs revision |
| `delete_memory` | When wrong or obsolete |
| `export_memories` | JSON or Markdown export (paste anywhere) |

### Notion sync (optional, user's own workspace)

| Tool | When |
|------|------|
| `snapcommit_notion_setup` | One-time: paste token + parent page URL, we create a database |
| `snapcommit_notion_sync` | Push local memories to your Notion (idempotent) |
| `snapcommit_notion_status` | Check connection state |
| `snapcommit_notion_pull` | Inspect Notion vs local counts |

**The differentiator**: Snapcommit captures *rejections*, not just decisions. Every other memory tool only stores final answers. Snapcommit remembers what you tried and *why it didn't work* — so future sessions don't repeat the same mistakes.

## Notion setup (90 seconds)

1. Go to [notion.so/profile/integrations](https://www.notion.so/profile/integrations)
2. Click **+ New integration**, name it "Snapcommit", choose your workspace, save
3. Copy the **Internal Integration Secret** (starts with `secret_` or `ntn_`)
4. In Notion, create a page where you want your memory to live (e.g. "AI Memory"). Open it, click `···` → **Add connections** → pick **Snapcommit**.
5. Copy the page URL.
6. In your AI tool, run:
   > "Set up Snapcommit Notion sync with token `secret_...` and parent page `https://www.notion.so/...`"

That's it. A "Snapcommit Memory" database appears in your page. Your AI starts saving there too.

**Your token never leaves your machine.** Stored at `~/.snapcommit-mcp/notion.json` with `chmod 600`.

## What you get from Notion sync

- **Cross-device** — log into Notion on any device, your memory's there
- **Sharing** — share the database with teammates the normal Notion way
- **Native editing** — fix typos, add tags, link memories in Notion's UI
- **Backup** — your memories are in your own workspace, not ours
- **Mobile access** — Notion's mobile app works

## Manual MCP install

If `npx @snapcommit/install` doesn't auto-detect your client, add to your MCP config:

**Claude Code:**
```bash
claude mcp add snapcommit -- npx -y @snapcommit/mcp
```

**Cursor / Claude Desktop / Continue / Cline / Windsurf / VS Code:**

```json
{
  "mcpServers": {
    "snapcommit": {
      "command": "npx",
      "args": ["-y", "@snapcommit/mcp"]
    }
  }
}
```

## Pricing

**Free tier (forever, MIT open source):**
- Local SQLite memory storage
- All MCP tools (save, recall, list, export, update, delete)
- Notion sync (your own workspace)
- Keyword search
- Web dashboard
- Auto-installer for 30+ MCP clients

**Snapcommit Pro — $9/mo:**
- **Smart AI extraction** — Claude/GPT writes better memories than regex can
- **Semantic search** — find memories by meaning, not just keywords
- **Auto-deduplication** — never save the same fact twice
- **Memory consolidation** — old related memories collapse into summaries
- **Conflict detection** — alerts when new memory contradicts an old one

**Lifetime — $149 one-time** (first 500 backers only): all Pro features forever, founder badge.

**Storage stays free, always.** We don't host your data. Notion does (your own workspace). We charge only for AI features Notion can't do.

## Privacy

- Data lives in `~/.snapcommit-mcp/memories.db` on your machine. Nowhere else by default.
- Notion sync is opt-in. When you opt in, data syncs to **your own Notion workspace**, not ours.
- No telemetry. We don't even know you exist.
- Open source — read the code, fork it, self-host it.

## Development

```bash
git clone https://github.com/Arjun0606/snapcommit
cd snapcommit
npm install
npm run build
./node_modules/.bin/vitest run
```

Dashboard:
```bash
cd dashboard
npm install
npm run dev
# http://localhost:4000
```

## Why "Snapcommit"

You snap a moment from your conversation. Commit it to memory. Recall it anywhere. Like git, but for AI context. The mental model is intentionally familiar to developers.

## License

MIT
