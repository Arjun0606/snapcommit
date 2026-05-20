# Snapcommit

**The memory layer for your AI tools.** One MCP server. Works across Claude Code, Cursor, VS Code, Claude Desktop, Cline, Windsurf, Codex CLI, Gemini CLI + 22 more clients.

Your memories live in a file you own. Sync however you want — iCloud, Dropbox, Notion, anything. Pro features run AI extraction on your conversations, processed in-flight, never stored.

```bash
npx @snapcommit/install
```

## Why

Reddit's #1 dev complaint about AI tools is "they never remember me." 91 hours/year wasted re-explaining context.

Existing fixes are bad:
- **OpenMemory** claims local-first but ships data to Mem0's cloud
- **Supermemory** is server-side, $19/mo, holds your data
- **Mem AI** burned $40M trying to be the database, pivoted
- **Markdown files** go stale, don't sync, live in 4 formats per tool

Snapcommit is different:
- **Your memory, your file.** Lives at a path you choose (local, iCloud, Dropbox, anywhere).
- **You sync however you want.** We don't build sync — your cloud provider does.
- **We're a compute service, not a database.** Pro features run extraction in-flight; we never store your conversations.

## Pricing

**Local memory is free open source (MIT).** Storage, sync, sharing, all 22 MCP tools — free forever, no account needed. The paid tiers unlock LLM-powered extraction running through our cloud.

| Tier | Price | Smart-extractions / month |
|---|---|---|
| **Hobby** | **$9/mo** | 200 + semantic search + auto-dedup |
| **Pro** | **$29/mo** | 2,000 + memory consolidation + conflict detection |
| **Studio** | **$129/mo** | 10,000 + custom prompts + premium-model option |

**Try it free** — paste any conversation into the live demo at [snapcommit.com](https://snapcommit.com) (3 demo extractions per IP per day, no signup). See what your AI will save before you subscribe.

All paid tiers handled by [Dodo Payments](https://dodopayments.com) — merchant of record, tax included worldwide. Cancel anytime. Automated dunning + reminder emails on failed payments.

**Smart-extractions run on GPT-5 Nano** (best structured-output quality/cost in 2026), with Gemini 2.5 Flash failover. Studio users can opt into Claude Haiku 4.5 for higher quality. Your conversations are processed in-flight and never stored on our servers.

**What we never charge for:** storage, sync, sharing, memory count, devices, team size, the MCP server itself.

## How sync works (we don't build it)

| You want | You do | Result |
|---|---|---|
| Single device | Nothing. Defaults work. | Local file, fast, offline |
| Sync across your devices | Put the file in iCloud / Dropbox / OneDrive | Your cloud auto-syncs |
| Share with team | Put the file in a shared cloud folder | Your cloud handles permissions |

The setup is one prompt:
> *"Move Snapcommit storage to `~/Library/CloudStorage/iCloud Drive/snapcommit/memories.db`"*

Done. iCloud (or whatever you use) handles the rest. Install Snapcommit on your other device, set the same path, memory carries over instantly.

## Tools (15 of them)

### Free (always-on, local)
- `save_memory` / `recall_memory` / `list_memories` / `list_projects` / `update_memory` / `delete_memory` / `export_memories`

### Account + config
- `snapcommit_status` — what's going on
- `snapcommit_login` — sign in with your API token (free tier ships with 5/mo)
- `snapcommit_account_status` — current tier, quota, usage
- `snapcommit_logout`
- `snapcommit_storage_info` / `snapcommit_set_storage_path` — pick where memories live

### Paid (counts against quota)
- `snapcommit_smart_extract` — LLM-powered memory extraction from a conversation chunk
- `snapcommit_usage` — quick quota check

### Optional adapter
- `snapcommit_notion_setup` / `_sync` / `_status` / `_pull` — mirror to your own Notion DB if you want Notion-as-UI

**The killer feature**: Snapcommit captures *rejections* with reasons. Every other tool stores only what you ended up doing. Snapcommit remembers what you tried and *why it didn't work* — so future sessions don't repeat the mistakes.

## Privacy

- Local memories live at a path you choose. No telemetry.
- `smart_extract` sends conversation chunks to our cloud, which proxies them to Anthropic. **Processed in-flight, never stored.** We log only metadata (timestamp, token count, success/fail).
- Open source. Read the code. Audit the cloud worker spec at `cloud/SPEC.md`.

## Install

### Auto (recommended)
```bash
npx @snapcommit/install
```

Detects and configures Claude Code, Cursor, Claude Desktop, Cline, Windsurf, VS Code.

### Manual (any MCP client)

**Claude Code:**
```bash
claude mcp add snapcommit -- npx -y @snapcommit/mcp
```

**Cursor / Claude Desktop / others:**
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

## Sign up for higher tiers

1. Visit https://snapcommit.com/signup
2. Get your API token by email
3. In your AI tool: *"Sign in to Snapcommit with token sct_live_..."*
4. Use Pro features: *"Smart-extract memories from this conversation summary..."*

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

Cloud worker (Cloudflare Worker + D1):
```bash
cd cloud
# See cloud/SPEC.md for endpoint contracts and deploy instructions
```

## License

MIT
