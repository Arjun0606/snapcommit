# Snapcommit

**The memory layer for your AI tools.** One MCP server. Works across Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf, Codex CLI, Gemini CLI + 22 more clients. Your memories live in a file you own. Sync however you want.

```bash
npx @snapcommit/install
```

That's it. We detect every MCP-capable AI tool on your machine and wire Snapcommit into each. Your AI now remembers across every session and every tool.

## Why

Reddit's #1 complaint about AI tools is "they never remember me." 91 hours/year wasted re-explaining context per solo founder.

Existing fixes are bad:
- **OpenMemory** claims local-first but ships your data to Mem0's cloud
- **Supermemory** is server-side, $19/mo subscription
- **Mem AI** burned $40M trying to be the database, now pivoting
- **Markdown files** go stale, don't sync, live in 4 different formats per tool

Snapcommit is **genuinely** local-first. Your memories live in a single file on your machine that you own. If you want cross-device sync or team sharing, you put that file in a cloud folder you already use — iCloud, Dropbox, OneDrive, Google Drive, whatever. We host nothing. We're the wire, not the warehouse.

## How sync works (it's already solved)

| You want | You do | Result |
|---|---|---|
| Single device, offline | Nothing. Defaults work. | Fast, private, no internet needed |
| Sync across your own devices | Put the file in iCloud / Dropbox / OneDrive | Your existing cloud provider auto-syncs |
| Share with a teammate | Put the file in a shared cloud folder | Notion-grade sharing for free, no logins, no UI |
| New laptop | Install Snapcommit, point at the same cloud-folder path | Memory carries over instantly |

The setup command for cloud-syncing on Mac:
> *In your AI: "Move Snapcommit storage to `~/Library/CloudStorage/iCloud Drive/snapcommit/memories.db`"*

That's the whole "cross-device sync feature." iCloud handles the rest.

## What it does

13 MCP tools your AI calls automatically:

### Memory (free, always-on, local)

| Tool | When |
|------|------|
| `save_memory` | Decisions, things tried-and-rejected (with reasons), preferences, facts, open questions |
| `recall_memory` | At session start or when past context matters |
| `list_memories` | Browse without searching |
| `list_projects` | Orient across projects |
| `update_memory` / `delete_memory` | Revise or remove |
| `export_memories` | JSON or Markdown, anywhere |

### Storage + config

| Tool | When |
|------|------|
| `snapcommit_storage_info` | Show where memories live + sync suggestions |
| `snapcommit_set_storage_path` | Point at a cloud-synced folder for device/team sync |
| `snapcommit_set_api_key` | Bring your own Anthropic/OpenAI key for Pro features |
| `snapcommit_status` | Overall state of the world |

### Snapcommit Pro ($99 lifetime via Dodo Payments)

| Tool | What it does |
|------|------|
| `snapcommit_smart_extract` | LLM-based memory extraction from conversation. Uses YOUR API key (BYOK). Higher quality than the free tier's keyword capture. |
| `snapcommit_activate_license` | Activate Pro with your license key |
| `snapcommit_license_status` | Check tier |

### Notion sync (optional advanced adapter)

| Tool | When |
|------|------|
| `snapcommit_notion_setup` | Mirror memories to a Notion database in your own workspace, for browsing in Notion's UI |
| `snapcommit_notion_sync` | Push local → Notion |
| `snapcommit_notion_status` | Check connection |

**The killer feature**: Snapcommit captures *rejections* with reasons, not just final decisions. Every other memory tool only stores what you ended up doing. Snapcommit remembers what you tried and *why it didn't work* — so future sessions don't repeat the same mistakes.

## Pricing

**Free tier (forever, MIT)**
- All 7 local memory tools
- Storage in a file you own (anywhere you want it)
- Notion sync adapter
- Auto-installer for 30+ MCP clients
- Web dashboard
- Keyword search

**Snapcommit Pro — $99 one-time via Dodo Payments**
- Smart LLM extraction (uses YOUR Anthropic/OpenAI key — we never see your data)
- Semantic search (find by meaning, not just keywords)
- Auto-deduplication
- Memory consolidation
- Conflict detection across devices
- All updates, forever

**Snapcommit Pro Yearly — $19/year** (cheaper upfront)
- Same Pro features, recurring

**What we never charge for**
- Storage (the file lives on your machine or your cloud)
- Sync (your cloud provider does it)
- Sharing (your cloud provider does it)
- Memory count (no arbitrary limits)
- API costs (Pro is BYOK — you use your own provider)
- Team plans (don't exist — shared folders are the team feature)

## Privacy

- Memories live at the path you choose. No telemetry. No tracking.
- Pro features call YOUR Anthropic/OpenAI API directly from your machine. We never see prompts, responses, or content.
- License check is one short request to our server once a day, cached locally — works offline most of the time.
- Open source. Read the code. Fork it. Self-host the license check if you don't trust us.

## Install

### One command (auto-detects your AI clients)
```bash
npx @snapcommit/install
```

### Manual install (any MCP client)

**Claude Code:**
```bash
claude mcp add snapcommit -- npx -y @snapcommit/mcp
```

**Cursor / Claude Desktop / Continue / Cline / Windsurf / Codex CLI / Gemini CLI / Zed / others:**
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

## Cross-device & team sharing

### Across your own devices (single user)

Put the file in any cloud-synced folder. On Mac:
```
~/Library/CloudStorage/iCloud Drive/snapcommit/memories.db
```
On Windows:
```
%USERPROFILE%\OneDrive\snapcommit\memories.db
```
On Linux:
```
~/Dropbox/snapcommit/memories.db
```

Set the path via your AI:
> "Move Snapcommit storage to ~/Dropbox/snapcommit/memories.db"

Or via env var:
```bash
export SNAPCOMMIT_STORAGE="$HOME/Dropbox/snapcommit/memories.db"
```

Install Snapcommit on your other devices with the same env var or storage-path config. Done.

### Sharing with a team

1. Pick a shared cloud folder (Dropbox shared, Google Drive shared, iCloud Shared, etc.)
2. All teammates set their `SNAPCOMMIT_STORAGE` to the same path
3. Memories saved by one teammate become visible to others when the cloud provider syncs

**Note on concurrent writes**: SQLite over cloud-synced folders works for single-user-multi-device perfectly. For teams writing simultaneously, occasional conflicts can happen — your cloud provider's conflict-file resolution handles it. Pro tier's conflict detection helps surface these.

## Pro setup (~2 minutes)

1. Buy Pro at https://snapcommit.com/pro (Dodo Payments, $99 one-time, includes tax)
2. Get license key via email
3. Add your AI provider key (Anthropic or OpenAI):
   > "Set my Anthropic API key to sk-ant-..."
4. Activate license:
   > "Activate Snapcommit license LICENSE-KEY-HERE"
5. Use Pro features:
   > "Extract memories from this session: [paste your conversation]"

Your API key and license live at `~/.snapcommit-mcp/config.json` with `chmod 600`. Neither leaves your machine.

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
cd dashboard && npm install && npm run dev
# → http://localhost:4000
```

## Why "Snapcommit"

You snap a moment from your conversation. Commit it to memory. Recall it anywhere. Like git, but for AI context.

## License

MIT
