# Snapcommit demo video — 90-second script

Target length: 90 seconds. Single screen recording, voiceover. No talking head.
Goal: viewer goes from "what is this" to "I want to install this" in 90 seconds.

---

## Setup before recording

- Clean macOS desktop, dark mode
- Two terminal windows side by side, both with Claude Code
- Pre-fill one with a project context loaded; the other empty
- Have snapcommit.com open in a third tab
- Mic check, no echoes

---

## Script (timed)

**[0:00 — 0:08] Cold open. Black screen. White text.**
> Voiceover (no music yet): *"Every time you start a new AI session, you re-explain everything."*

**[0:08 — 0:18] Cut to: Claude Code window. User typing.**
On screen: A user typing into a fresh Claude Code session.
> Voiceover: *"This is me, starting a new session on a project I've been working on for weeks. Watch how much I have to re-say."*

Show 4-5 lines of context-setting:
- "OK so this is the snapcommit project, we're building..."
- "We decided last week to use SQLite, not Postgres..."
- "Don't suggest Notion — we already tried it..."

**[0:18 — 0:25] Pull back. Show another tab — the *same project* in Cursor.**
> Voiceover: *"And then I switch to Cursor on the same project. I have to do it all over again."*

Same context-setting, repeated. Slight frustration in voice.

**[0:25 — 0:30] Pause. White text on black.**
> Voiceover: *"Reddit calls this dev complaint number one. 91 hours a year. Per founder."*

**[0:30 — 0:35] Logo flash.**
Big "Snapcommit" wordmark. Green accent. Tagline below: "Memory for your AI tools. Your file. Our compute."

**[0:35 — 0:50] One terminal command.**
Show terminal: `npx @snapcommit/install`
On screen: detection animation — *"Detected Claude Code... Cursor... Claude Desktop... wired."*
> Voiceover: *"One command. Snapcommit hooks itself into every MCP client you have."*

**[0:50 — 1:05] Demonstrate — Claude Code, new session.**
User types: *"What did we decide about storage for snapcommit?"*

Cut to Claude responding instantly with the past decision pulled from memory, including the rejection: "*We use SQLite. Mem0 was rejected because it ships data to their cloud despite the 'local-first' branding.*"

> Voiceover: *"Same project, new session. Claude already knows. Because Snapcommit remembered the decision — AND why we rejected the alternative."*

**[1:05 — 1:15] Switch to Cursor. Same query.**

Same answer comes back in Cursor.

> Voiceover: *"Different tool. Same memory. One file on your machine — yours, encrypted on your disk, optionally synced via your own iCloud or Dropbox."*

**[1:15 — 1:25] Cut to snapcommit.com homepage demo widget. Quick paste, quick extraction.**

> Voiceover: *"Try it without signing up — paste any conversation at snapcommit.com. See exactly what your AI will save."*

**[1:25 — 1:30] End card.**

Logo. Tagline: "snapcommit.com — Memory for your AI tools."
Small text: "From $9/month. Open source on GitHub."

> Voiceover: *"Snapcommit. Memory for your AI tools. From nine bucks a month."*

---

## Recording checklist

- [ ] Record at 1080p, 60fps if possible
- [ ] Use Screen Studio or CleanShot — automatic zoom on cursor
- [ ] Voiceover after — easier to time
- [ ] No background music until 0:30, then subtle synth pad
- [ ] Export as MP4 + Twitter-aspect crop (1:1 or 9:16) for social
- [ ] Caption the whole thing for muted autoplay on Twitter/HN

## Distribution

- Embed at the top of snapcommit.com homepage (above the demo widget)
- Tweet thread day-of launch
- Show HN: link in the body
- Product Hunt gallery: first asset
- LinkedIn one post day-of
- Indie Hackers post in week 1
