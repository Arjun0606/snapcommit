# First blog post: "Why we're not a database"

Title options:
1. **Why we're not a database** ← my pick
2. The Plaid model for AI memory
3. We're the wire, not the warehouse

Audience: AI builders, dev-tools founders, indie hackers. People who read HN/dev Twitter.

Target length: 800-1200 words.

---

## Draft

### Why we're not a database

There are two kinds of AI memory products. One stores your data on their servers and charges you to access it. The other ships their data to a third party's cloud while telling you it's "local-first."

Snapcommit is neither. Snapcommit is the wire between your AI tools and a memory file you own. We don't store your memories. We don't even pick where they live.

Here's why we designed it this way, and what it means for you.

#### The pain everyone complains about

Reddit's #1 developer complaint about AI tools is that they never remember you. Across an analysis of 500 complaints from r/ChatGPT, r/ClaudeAI, r/cursor, r/SaaS, and others, this beat hallucinations, beat latency, beat pricing. 91 hours per year wasted per solo founder, just re-explaining context.

Existing memory products exist. They're not winning, and the reason is that none of them solved trust.

#### What the existing players got wrong

**Mem AI** raised $40 million and burned through it. They built a beautiful product, but they were a database. Your data lived on their servers. When they pivoted, your trust was already gone.

**Pi** (Inflection) had a million users and a $1.5B raise. They built a beautiful AI companion. Then they pivoted to B2B and stopped serving consumers. Your memories went with them.

**OpenMemory** (Mem0's Chrome extension) markets itself as "local-first" — but a recent review revealed it actually ships your data to Mem0's cloud servers for processing. The marketing is the lie. The reviews are the receipts.

**Supermemory** is open about being server-side. They charge $19/month to hold your data. They scored highest on the LongMemEval benchmark and have 11K Chrome reviews — but the Chrome Web Store rating is 3.4 stars, because UX and trust hadn't been the priority.

**Markdown files** — what most devs actually use — work fine until they don't. They go stale within a week, every tool wants a different format, and nothing syncs.

The pattern across all of them: somebody else holds your data. And in 2026, with 90% of users worrying about AI handling their data (per Malwarebytes) and 88% refusing to freely share with AI tools, that's the wrong end of the trust trade.

#### What if nobody holds the data?

Snapcommit's design is a single principle: **we are not a database**.

Your memories live in a SQLite file on your machine. That's the entire storage layer. We don't have an API into it. We never see it. If we shut down tomorrow, you still have the file.

To sync across your own devices, you put that file in a cloud-synced folder you already use: iCloud, Dropbox, OneDrive, Google Drive. Your existing cloud provider handles the sync — we don't write a single line of sync code.

To share with a teammate, you put the file in a shared cloud folder. Your existing provider handles permissions, conflict resolution, mobile access. Again, zero code from us.

To browse memories in a polished UI, you can mirror them to your own Notion workspace via an optional adapter. Your Notion workspace, your data, your sharing rules.

This is the Plaid pattern. Plaid doesn't store your bank balance — they connect. Stripe doesn't manage your inventory — they process. Snapcommit doesn't host your memory — we wire your AI to your storage.

#### So what do you charge for?

LLM compute. Specifically: smart extraction.

You can save and recall memories manually all day, free, with the open-source MCP server. The paid feature is "give Snapcommit a conversation chunk, get back structured memories" — decisions, rejected approaches with reasons, preferences, facts, open questions.

That requires running an LLM. We run GPT-5 Nano (best structured-output quality at this price point, $0.0005 per call) with Gemini 2.5 Flash failover. The conversation chunks you send hit our Cloudflare-edge function, get proxied to the LLM, return memories — and the content is processed in-flight only. We never write it to our database. Logs are metadata: `(user_id, timestamp, model name, token counts, ok)`.

We charge between $9 and $129 per month for varying amounts of extraction. 90%+ margin because we're not paying for storage we don't have.

#### What this means for the user

You get:
- A free local product (MIT licensed, you own the code)
- Cross-device sync without us building it
- Team sharing without us building it
- Mobile access through your existing cloud apps
- Backups through your existing cloud provider
- AI extraction through our paid cloud (in-flight, never stored)

You give up:
- Nothing, really. We don't ask you for OAuth scopes, file access, contacts, or anything else.

#### What this means for us

We avoid:
- Storage costs that scale with users
- Backup management
- Security audits / SOC2 / GDPR theater on user content
- Vendor lock-in concerns that kill trust
- The "if we shut down all your data is gone" problem
- Tax compliance complexity (Dodo Payments handles globally)

We get:
- 90%+ margins
- Solo-dev sustainability
- A clear story for HN, Twitter, and dev-tool audiences

#### The bet

The bet is that "your data, your storage, your cloud, our compute" is what 2026 looks like for AI tooling. Not because we're prescient, but because:

1. Trust in centralized AI is at an all-time low.
2. Most users already pay for cloud storage they're not using fully.
3. MCP gives us a standard interface to ride.
4. Solo founders need infrastructure they don't have to maintain.

If we're right, we build a small, sustainable business serving developers who care about owning their data. If we're wrong, our infrastructure budget is so small we can find out cheaply.

Try it: snapcommit.com (live demo, no signup needed). Or read the code: github.com/Arjun0606/snapcommit.

---

## Distribution plan

- Post on snapcommit.com/blog as the launch post
- Submit to dev.to, hacker news, indie hackers, r/SaaS
- Cross-post to your own Substack/newsletter if you have one
- Quote-tweet excerpts as standalone tweets through the week
- Link from the HN Show comment

## Variations

If you want a 400-word version for indie hackers: cut the "what the existing players got wrong" section to one paragraph and remove the bet section.

If you want a longer version for LinkedIn: add a personal-story opening ("I was on my 5th project of the week, restarting Claude Code, when...") and bullet the key principles.
