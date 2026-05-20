# Pre-launch checklist

Do NOT post Show HN until every checkbox here is green.

---

## Infrastructure

- [ ] **GitHub repo public.** `gh repo create Arjun0606/snapcommit --public --source=. --push`
- [ ] **Supabase project created**, project ref noted
- [ ] **Database migrations run**: `supabase db push`
- [ ] **Supabase Edge Functions deployed**: `supabase functions deploy`
- [ ] **Supabase secrets set**: OPENAI_API_KEY, DODO_API_KEY, DODO_WEBHOOK_SECRET
- [ ] **Supabase Auth configured**: site URL, redirect URLs, email templates
- [ ] **OpenAI account funded**: minimum $20 on the API key
- [ ] **(Optional) Gemini API key set** as failover

## Dodo Payments

- [ ] **Account created and verified** (KYC done)
- [ ] **3 products created**: Hobby $9/mo, Pro $29/mo, Studio $129/mo
- [ ] **Each product set to "recurring"** with monthly billing
- [ ] **Subscription metadata** includes `tier` field on each product
- [ ] **Tax settings** configured for global sales-tax/VAT
- [ ] **Webhook endpoint** set to `https://<project-ref>.supabase.co/functions/v1/dodo-webhook`
- [ ] **Webhook signing secret** copied into Supabase secrets
- [ ] **Customer portal enabled** with allowed mutations: change plan, update payment, cancel
- [ ] **Checkout URLs copied** into site env: DODO_LINK_HOBBY, DODO_LINK_PRO, DODO_LINK_STUDIO

## Landing page (site/)

- [ ] **Deployed to Vercel** (free tier fine for v1)
- [ ] **Custom domain** snapcommit.com pointed at Vercel
- [ ] **Env vars set on Vercel**: SNAPCOMMIT_API, DODO_LINK_HOBBY, DODO_LINK_PRO, DODO_LINK_STUDIO
- [ ] **Live demo widget works end-to-end** (test from incognito browser)
- [ ] **Demo rate limit (3/day/IP)** actually triggers — verify the 429 response
- [ ] **/privacy and /terms pages** load and read correctly
- [ ] **Checkout buttons** redirect to correct Dodo checkout URLs
- [ ] **Performance** — Lighthouse score >85
- [ ] **Open Graph image** set for snapcommit.com (1200x630 with hero text)
- [ ] **Favicon** added (16x16, 32x32, apple-touch-icon)

## npm packages

- [ ] **`@snapcommit/mcp@0.1.0` published**: `npm publish --access public`
- [ ] **`@snapcommit/install@0.1.0` published** (or rename — it's currently bundled in the same package as `bin/install`)
- [ ] **Test from a fresh machine**: `npx @snapcommit/install` actually works
- [ ] **README on npm package page** renders correctly

## MCP server

- [ ] **`snapcommit_smart_extract`** points at the deployed Supabase URL by default
- [ ] **Tested locally** with a real subscribed account + token
- [ ] **Sign-in flow tested**: paste token → see tier + quota in account_status
- [ ] **Quota nudges fire** at 80%, 95%, 100% thresholds
- [ ] **Quota exceeded** returns clear upgrade message
- [ ] **Cancellation flow tested**: cancel in Dodo → webhook fires → tier becomes inactive → next call gets reactivate message
- [ ] **Account deletion tested**: confirm email arrives, link works, account removed from DB

## End-to-end test (the real one)

Do this in production with real money:

- [ ] Subscribe to Hobby ($9) using a real card on snapcommit.com
- [ ] Receive email with API token within 2 minutes
- [ ] Run `npx @snapcommit/install` on a fresh machine
- [ ] Sign in with token in Claude Code
- [ ] Save 3 memories manually with `save_memory`
- [ ] Call `smart_extract` on a real conversation snippet
- [ ] Verify usage counter increments
- [ ] Open billing portal with `snapcommit_open_billing`
- [ ] Cancel subscription
- [ ] Verify next month's tier becomes inactive (or skip to webhook test)
- [ ] Re-subscribe with same email — verify token is the same / a new one is issued cleanly

## Marketing assets

- [ ] **Demo video** recorded (90s, see docs/launch/demo-video-script.md)
- [ ] **Demo video uploaded** to Twitter, YouTube (unlisted)
- [ ] **PH gallery images** (5, see docs/launch/product-hunt-copy.md)
- [ ] **Twitter thread drafted** (see docs/launch/twitter-thread.md)
- [ ] **Show HN post drafted** (see docs/launch/show-hn-copy.md)
- [ ] **PH product page created** (in draft state, not published until launch day)
- [ ] **PH hunter identified and confirmed**
- [ ] **First blog post drafted** (see docs/launch/first-blog-post.md)

## Operational readiness

- [ ] **Support email** hello@snapcommit.com set up and inbox monitored
- [ ] **Plausible/Umami analytics** added to site (snapcommit.com)
- [ ] **Sentry or Logflare** for error monitoring on the Edge Functions
- [ ] **Uptime monitoring** (BetterStack, UptimeRobot) for snapcommit.com and the Supabase Functions
- [ ] **Status page** (status.snapcommit.com via BetterStack or similar) — not required for launch but nice
- [ ] **Twitter account** @snapcommit (or whatever) set up with bio + link

## Final sanity

- [ ] **Run the entire onboarding** as a brand-new user. Don't skip steps. Time it.
- [ ] **Have one friend run the entire onboarding** while you watch. Note every friction point.
- [ ] **Set a calendar reminder** for the launch day morning — 7am PT
- [ ] **Block your calendar** for the next 48 hours after launch to respond to comments

---

## Launch sequence (the actual hour-by-hour)

**T-24h:**
- DM your hunter
- DM 3-5 supportive devs
- Send a "soft heads up" to your email list (if you have one)
- Do not pre-share the HN URL with anyone (HN flags it)

**T-1h:**
- Coffee
- Open HN, PH, Twitter, your support inbox, your Vercel logs
- Quickly hit the live site from incognito to confirm everything works

**T-0 (launch):**
- 6:30 AM PT — submit Show HN
- 7:00 AM PT — post Twitter thread + demo video
- 7:30 AM PT — your hunter submits to PH (or 12:01 AM PT if PH timezone matters)
- 8:00 AM PT — first reply to any HN comments

**T+8h:**
- Post a "thanks for the early reception" tweet with traction screenshot
- Reply to every HN/PH comment
- Drink water

**T+24h:**
- Check signups. Check usage. Check error logs.
- Post a "Day 1 numbers" tweet (if numbers are good) or "Quiet day, here's what I'm fixing" (if not)

**T+72h:**
- Write a "what I learned launching" post
- Submit blog post to dev.to / indie hackers
