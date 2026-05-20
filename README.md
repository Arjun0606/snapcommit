# Snapcommit

**Git for your AI context.** One MCP server. Memory across Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf + 25 more clients. Local-first. Open source.

```bash
npx @snapcommit/install
```

That's it. Snapcommit detects which AI tools you have installed, configures each one, and now your AI remembers across every session and every tool.

## Why

You re-explain your project to every new AI session. You re-state preferences. You re-paste context from one tool to another. Reddit's #1 dev complaint about AI tools is "they never remember me." 91 hours/year wasted per solo founder.

Existing fixes are bad:
- **OpenMemory** claims "local-first" but ships your data to Mem0's cloud
- **Supermemory** is server-side, $19/mo
- **Mem AI** burned $40M and pivoted
- **Markdown files** go stale, don't sync, and live in 4 different formats per tool

Snapcommit is **genuinely** local-first. Memories live in a SQLite file on your machine (`~/.snapcommit-mcp/memories.db`). Cloud sync is opt-in and paid, never default.

## What it does

The MCP server exposes five tools your AI calls automatically:

| Tool | When the AI calls it |
|------|---------------------|
| `save_memory` | When something is worth remembering: a decision, an approach you tried and rejected (with reasons), a preference, a fact about the codebase, an open question |
| `recall_memory` | At the start of a session or whenever past context is relevant |
| `list_projects` | To orient itself across multiple projects |
| `update_memory` | When a memory needs revision |
| `delete_memory` | When a memory is wrong or obsolete |

**The killer feature**: Snapcommit captures *rejections*, not just decisions. Every other memory tool only stores what you ended up doing. Snapcommit remembers what you tried and *why it didn't work* — so future sessions don't repeat the same mistakes.

## Manual install

If `npx @snapcommit/install` doesn't auto-detect your client, add this to your MCP config:

**Claude Code:**
```bash
claude mcp add snapcommit -- npx -y @snapcommit/mcp
```

**Cursor / Claude Desktop / Continue / Cline / Windsurf / VS Code:**

Add to your `mcp.json` (or equivalent):
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

- **Free forever** — local-only, unlimited memories, full features, MIT licensed
- **$9/mo Pro** — encrypted cloud sync, browse-anywhere web dashboard, advanced extraction
- **$99 lifetime** — one-time backer tier, Pro forever, supports the project

## Privacy

- Data lives in `~/.snapcommit-mcp/memories.db` on your machine
- We never read your memories. We can't — they're on your disk.
- Cloud sync (paid tier) is end-to-end encrypted with your passphrase
- No telemetry that captures content. Ever.

## Development

```bash
git clone https://github.com/Arjun0606/snapcommit
cd snapcommit
npm install
npm run build
npm run inspect  # opens MCP Inspector for local testing
```

## Why "Snapcommit"

You snap a moment from your conversation. Commit it to memory. Recall it anywhere. Like git, but for context. The mental model is intentionally familiar to developers.

## License

MIT
