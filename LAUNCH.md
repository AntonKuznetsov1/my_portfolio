# Production launch runbook

One-time procedure to take the portfolio live on Cloudflare Workers. Ongoing hosting notes live in
[DEPLOYMENT.md](DEPLOYMENT.md); this file is the ordered launch checklist.

Current state: builds clean, bundle is ~2.5 MiB against the 3 MiB Workers Free limit, and every page, the admin, uploads
and the Supabase RPCs have been verified against a local preview of the production Worker.

---

## How environment variables actually resolve

Read this before step 4, because it is the easiest way to ship a stale secret.

Next.js inlines `NEXT_PUBLIC_*` into the client bundle **at build time**. Those cannot be supplied at runtime and must
exist in `.env.local` when you build.

Everything else is read on the server. OpenNext writes your `.env.local` values into
`.open-next/cloudflare/next-env.mjs` as fallbacks, and its runtime init applies them like this:

```js
for (const [key, value] of Object.entries(env)) process.env[key] = value // Cloudflare bindings win
process.env[key] ??= nextEnvVars[mode][key] // baked value only if unset
```

Consequences:

- A secret set with `wrangler secret put` **overrides** the baked-in value. Rotation works.
- A secret you _forget_ to set silently falls back to the value in `.env.local`. There is no warning. This is how an old
  or revoked key keeps working after you rotate it.
- The baked values live inside the deployed Worker script. They are not reachable from a browser (static assets were
  verified clean), but anyone with read access to your Cloudflare account can extract them with `wrangler deployments`.
  That is another reason to rotate the service role key rather than leaving the exposed one in place.

---

## Step 1 — Rotate the Supabase service role key (do this first)

The current `SUPABASE_SERVICE_ROLE_KEY` was pasted in plaintext into a chat session during development. Treat it as
compromised and rotate before deploying.

1. Supabase dashboard → **Project Settings → API**.
2. Disable or delete the existing service role key.
3. Create a new key.
4. Keep the new value somewhere safe; you need it in step 2 and step 4.

Leave the `anon` / `publishable` key alone. It is public by design and already in `.env.local`.

## Step 2 — Update `.env.local`

Put the new key in exactly one place. `.env.local` must have **no duplicate keys**: dotenv is last-wins, so a leftover
line silently overrides the one above it.

```sh
cd ~/WebDev/portfolio/structure/akcadag.dev-
cp .env.local .env.local.bak     # optional, delete after launch
```

Confirm it is well-formed before continuing:

```sh
grep -oE '^[A-Za-z_0-9]+=' .env.local | sort | uniq -d   # must print nothing
```

Also confirm `NEXT_PUBLIC_SITE_URL` is the domain you are actually launching. It becomes the canonical origin in
metadata, the sitemap and robots.txt, and it is baked into the build.

```sh
grep '^NEXT_PUBLIC_SITE_URL=' .env.local
```

## Step 3 — Authenticate Wrangler

```sh
npx wrangler login
```

Opens a browser to authorise. Verify with `npx wrangler whoami`.

## Step 4 — Set the three runtime secrets

These are what make `/admin` work. Without them the admin renders "not configured".

```sh
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY   # paste the NEW key from step 1
npx wrangler secret put ADMIN_PASSWORD             # must match what you type at /admin/login
npx wrangler secret put ADMIN_SESSION_SECRET       # openssl rand -hex 32
```

Generate a fresh session secret rather than reusing the development one:

```sh
openssl rand -hex 32
```

Confirm they are set (names only, values are never returned):

```sh
npx wrangler secret list
```

Optional, only if you want the feature:

| Secret                                                               | Enables            |
| -------------------------------------------------------------------- | ------------------ |
| `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`, `CONTACT_FROM_EMAIL` | contact form email |
| `RAINDROP_ACCESS_TOKEN`                                              | bookmarks import   |
| `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`                     | Contentful pages   |
| `NEXT_PUBLIC_TINYBIRD_TOKEN`                                         | analytics          |

## Step 5 — Install so the bundle patch runs

```sh
npm install
```

This matters. `postinstall` runs `scripts/patch-opennext-og-worker.mjs`, which strips satori, `resvg.wasm` and
`yoga.wasm` out of the middleware bundle. Skip it and the Worker goes to ~3.2 MiB, over the Free-plan limit.

## Step 6 — Check the bundle before deploying

```sh
rm -rf .next .open-next
NEXT_PRIVATE_STANDALONE=true NEXT_PRIVATE_OUTPUT_TRACE_ROOT="$(pwd)" npm run build
npx opennextjs-cloudflare build --skipNextBuild
npx wrangler deploy --dry-run
```

Read the `gzip:` figure. It must stay below `3072 KiB`. Currently ~2567 KiB.

Build-time values must be present, so run this from a shell where `.env.local` is loaded — `npm run build` reads the
file automatically.

## Step 7 — Deploy

```sh
npm run deploy:cloudflare
```

That runs the build, the OpenNext build and `wrangler deploy` in one go. First deploy creates the Worker named
`anton-portfolio`. Do not rename it: `wrangler.jsonc` has a `WORKER_SELF_REFERENCE` service binding pointing at that
exact name.

## Step 8 — Verify before touching DNS

```sh
curl -sI https://anton-portfolio.<your-subdomain>.workers.dev | head -20
```

Check all of these:

- `/`, `/projects`, `/writing`, `/skills`, `/journey`, `/bookmarks`, `/contact` return 200
- `/sitemap.xml` and `/robots.txt` return 200 and list the real domain
- `/icon.png` returns 200 `image/png`
- Security headers are present: `x-content-type-options`, `referrer-policy`, `x-frame-options`, `permissions-policy`,
  `strict-transport-security`
- `/admin` redirects to `/admin/login` when signed out
- Signing in works, and publishing a post renders it on `/writing/<slug>` with its image
- Uploading an image works and the file appears in the Supabase bucket

## Step 9 — Attach the custom domain

1. Cloudflare dashboard → **Workers & Pages → anton-portfolio → Settings → Domains & Routes**.
2. **Add Custom Domain** → `antonkuz.com`.
3. Cloudflare creates the DNS record and provisions TLS automatically. Usually a minute or two.
4. Optionally add `www.antonkuz.com` as a second custom domain.

A registered domain is not free, but Worker hosting and TLS on it are within Cloudflare's free tier. If the domain is
registered elsewhere, add the nameservers Cloudflare assigns.

Verify after DNS propagates:

```sh
curl -sI https://antonkuz.com | head -20
```

## Step 10 — Housekeeping

```sh
rm -f .env.local.bak          # contains real secrets
rm -f ~/WebDev/portfolio/structure/akcadag.dev-/.dev/vars.bak 2>/dev/null
```

---

## After launch

**Automatic deploys.** Connect the repo in Cloudflare: **Workers & Pages → Create → Import repository**, or **Workers
Builds** on the existing Worker. Use the same build command as `deploy:cloudflare`, and set the secrets from step 4 in
the dashboard rather than in the repo. Note that `NEXT_PUBLIC_SITE_URL` and the other public values are build-time, so
changing them means a rebuild, not just a secret update.

**Supabase Free pauses after a week of inactivity** and the project may need resuming from the dashboard. That does not
affect static assets already on Cloudflare, but the CMS, likes and view counters will error until it is resumed.

**Rotating a secret later.** `wrangler secret put` is enough, no rebuild needed, because runtime bindings win over the
baked values. No need to rebuild. Rebuild only if you change a `NEXT_PUBLIC_*` value.

**Bundle size.** Re-run step 6 after any dependency change. An OpenNext upgrade is the most likely thing to push it back
over the limit, because the middleware patch anchors on a specific file inside that package.
