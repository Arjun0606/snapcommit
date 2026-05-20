# Deploying the waitlist site

The site (`site/`) is a Next.js app that builds to static HTML. No backend
required — the waitlist form posts directly to Web3Forms, which emails you on
every signup. Two deploy paths, both free.

---

## Step 1 (do this once, regardless of host): get a Web3Forms access key

1. Go to <https://web3forms.com/>
2. Enter your email under "Get Access Key"
3. Web3Forms emails you back an access key (looks like `abc123-def456-...`)
4. That's it. No dashboard, no signup, no auth. They'll email you on every signup.

Cost: free, unlimited submissions, forever.

If you ever want a real dashboard with CSV export, you can swap to Formspree, Getform, or wire it to your own Supabase later. The form code is one line away from any of them.

---

## Path A — GitHub Pages (zero infra, free)

Cheapest, simplest, but the URL is `arjun0606.github.io/snapcommit`. Custom domain (snapcommit.com) requires Pages CNAME setup.

### Setup (one time)

1. In GitHub repo Settings → **Pages**: set Source to "GitHub Actions"
2. In GitHub repo Settings → **Secrets and variables** → Actions → New repository secret:
   - Name: `WEB3FORMS_KEY`
   - Value: your Web3Forms access key from Step 1

3. Push any change to the `site/` directory — the existing workflow
   `.github/workflows/deploy-site.yml` runs automatically, builds the static
   site, and publishes it to GitHub Pages.

4. After ~2 minutes the site is live at:
   ```
   https://arjun0606.github.io/snapcommit/
   ```

### Custom domain (snapcommit.com) on GitHub Pages

1. In GitHub Settings → Pages → set Custom domain to `snapcommit.com`
2. Add a file `site/public/CNAME` containing just `snapcommit.com`
3. At your DNS provider (Namecheap / Porkbun / Cloudflare):
   - `A` record → `185.199.108.153` (and `109.153`, `110.153`, `111.153`)
   - or `CNAME` for www → `arjun0606.github.io`
4. Wait 5-30 min for DNS propagation
5. Set `BASE_PATH=""` in the workflow (since it's now root-domain not subpath)

---

## Path B — Vercel (also free, recommended for future)

Vercel is purpose-built for Next.js. Faster builds. Works without static
export. Future-proof if you ever add API routes back.

### Setup (one time)

1. Sign up at <https://vercel.com>
2. **Import Git Repository** → pick `Arjun0606/snapcommit`
3. **Root Directory**: `site` (this is important — pick the subfolder, not repo root)
4. **Framework**: Next.js (auto-detected)
5. **Environment Variables**:
   - `NEXT_PUBLIC_WEB3FORMS_KEY` = your access key from Step 1
6. Click **Deploy**

After ~90 seconds: live at `https://snapcommit-xxx.vercel.app`.

### Custom domain (snapcommit.com) on Vercel

1. Vercel Project → Settings → Domains → Add `snapcommit.com` and `www.snapcommit.com`
2. Vercel shows you DNS records to add
3. At your DNS provider, add the records
4. Done — usually faster than GitHub Pages

### Vercel-only note

Set `BASE_PATH=""` (or just omit the env var) in the Vercel settings — Vercel deploys to the root, not a subpath.

---

## Which path to pick

| | GitHub Pages | Vercel |
|---|---|---|
| Cost | Free | Free |
| Setup time | 5 min | 3 min |
| Build speed | Slow (GitHub Actions queue) | Fast (Vercel native) |
| Custom domain | Free | Free |
| Future: API routes | ❌ static only | ✅ supported |
| Future: ISR / dynamic | ❌ | ✅ |
| Where most indie sites are | — | most |

**Recommendation: Vercel.** Same workflow (push to GitHub, auto-deploys), faster builds, room to grow when you add the real backend.

GitHub Pages is fine if you specifically want everything in one ecosystem and don't want a new account.

---

## Sharing the waitlist URL today

Once deployed, share the URL directly:
- DMs to your network (top channel)
- Twitter post with a screenshot
- Indie Hackers showcase post
- BetaList submission
- Reddit (r/SaaS, r/SideProject) — careful, lead with question not link
- Hacker News "Ask HN" (NOT Show HN until launch — save that for v1)

See `docs/launch/waitlist-distribution.md` for the full distribution playbook.
