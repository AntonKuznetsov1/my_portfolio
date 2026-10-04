# Local development and free deployment

## Local development

From this project directory:

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a preview in Cloudflare's Workers runtime (closer to production):

```sh
npm run preview:cloudflare
```

Stop either running server with Ctrl+C.

## Free hosting plan

- **Cloudflare Workers**: host the Next.js app, pages, and API routes with the OpenNext adapter. The current Worker
  bundle was dry-run checked at about 2.5 MiB compressed, under the current 3 MiB Workers Free bundle limit. Re-check
  with `npx wrangler deploy --dry-run` after dependency changes.
- **Supabase Free**: store contact messages and optional page-view counts. Its free project includes 500 MB database and
  may pause after a week of inactivity; free projects are limited to two active projects.
- **Render**: not needed for this architecture. A Render web service would duplicate the Cloudflare API runtime; Render
  free services sleep after 15 minutes idle. Render free Postgres expires after 30 days, so do not use it for long-term
  contact messages.
- **Cloudflare Pages**: this app uses Next.js server rendering and API routes, so deploy it as a **Worker via
  OpenNext**, not as a plain static Pages export.

Provider free tiers and quotas can change. Check their pricing pages before launch.

## Admin CMS setup (Supabase)

The admin at `/admin` creates, edits and deletes blog posts and projects, stores their images in Supabase Storage, and
powers the per-visitor like buttons. All of that lives in one migration.

1. In Supabase **SQL Editor**, run [`supabase/portfolio.sql`](supabase/portfolio.sql). It creates `posts`,
   `post_images`, `projects`, `project_images`, `pages`, `post_likes`, the `toggle_post_like` / `get_post_like_status` /
   `bump_page_view` RPCs, RLS policies, and a public `portfolio` Storage bucket. Run
   [`supabase/contact_messages.sql`](supabase/contact_messages.sql) as well if you use the contact form.
2. Add the project URL, anon key, service-role key and admin credentials to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD=choose-a-password
ADMIN_SESSION_SECRET=output-of-openssl-rand-hex-32
```

3. Open `/admin` and sign in. `/admin` is intentionally unlisted: it returns `noindex` and is not in the sitemap, but
   nothing prevents a visitor who guesses the path from reaching the login form.

For Cloudflare, add `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` as Worker **secrets**, and
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` as Worker variables, then redeploy.

Notes on the security model:

- The anon key is public by design. Every public read goes through RLS, and the only writes a browser can make are
  through the three RPCs: likes (enforcing one row per `(post_id, visitor_id)`) and the page-view counter. The counter
  is incremented inside the database, so a visitor can never set a count directly and concurrent views cannot overwrite
  each other.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is used only in server actions and authenticated route handlers, is never
  imported by a client component, and is never prefixed with `NEXT_PUBLIC_`.
- Image rows store the storage object key in `path` alongside the public `url`. Deleting an image uses `path`, so it
  never has to guess the key by parsing the URL.
- The session is an HMAC-signed, `httpOnly`, `SameSite=Strict` cookie valid for 7 days. `src/proxy.js` redirects
  unauthenticated `/admin` requests, and every action and route handler re-validates the cookie independently.
- `ADMIN_PASSWORD` is compared with a timing-safe check, and repeated failures from the same IP are throttled in memory.
  That throttle resets whenever the Worker restarts, so put Cloudflare rate limiting in front of `/admin/login` before
  launch.

## Contact form setup (Supabase)

1. Create a Supabase project on its Free plan.
2. In Supabase **SQL Editor**, run [`supabase/contact_messages.sql`](supabase/contact_messages.sql).
3. Copy the project URL and anon/publishable key into a local `.env.local` file for `next dev`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

The contact API validates and stores messages in `contact_messages`. Row Level Security allows anonymous **inserts
only**; visitors cannot read the inbox. View submissions in Supabase **Table Editor**. Do not use a Supabase
service-role key in the browser or expose it as a `NEXT_PUBLIC_` variable.

For Cloudflare, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Worker’s **Settings →
Variables and Secrets**, then redeploy. The anon key is designed to be public; database access is protected by RLS.

Because `NEXT_PUBLIC_` values can be embedded into the Next.js build, also set those values in Cloudflare's build
environment before deployment. Set `NEXT_PUBLIC_SITE_URL=https://antonkuz.com` there as well. The portfolio metadata is
now configured for that domain.

## Optional email notifications

The contact form always stores messages in Supabase. Email alerts are optional and require a Resend account (its free
tier is subject to Resend's current limits) and a sender domain verified with Resend.

Set these server-side values in Cloudflare Worker **Settings → Variables and Secrets**:

- `RESEND_API_KEY` — secret; never commit or expose it in a `NEXT_PUBLIC_` variable.
- `CONTACT_NOTIFICATION_EMAIL` — inbox where new submissions should arrive.
- `CONTACT_FROM_EMAIL` — sender on your verified Resend domain, for example `Portfolio <contact@your-domain.example>`.

Add the same values to `.env.local` for local testing. Email failures are logged by the API; they do not discard a
message already saved in Supabase. Until these are configured, submissions are stored in Supabase only.

## Cloudflare preview and deploy

The project is already configured with OpenNext, Wrangler, a Worker config, static asset caching, and a local
`.dev.vars` file. Preview locally:

```sh
npm run preview:cloudflare
```

Authenticate Wrangler once:

```sh
npx wrangler login
```

Then deploy to your Cloudflare account:

```sh
npm run deploy:cloudflare
```

In Cloudflare, add `antonkuz.com` as a custom domain for the Worker and complete the DNS/TLS prompts. A custom domain
name itself is usually paid; the Worker hosting and TLS are free within Cloudflare's current free-tier quotas.

Alternatively, connect the GitHub repository to Cloudflare Workers Builds and use the same build setup. Set the Supabase
and optional Resend values in the Cloudflare dashboard before deploying. No paid Render service is required.

## Open Graph images

Link previews are pre-rendered to static PNG files by `scripts/generate-og.mjs`, which also runs automatically before
every build, instead of being rendered per request. The images are checked in, so re-run `npm run generate:og` after
changing the copy or icons in that script.

Rendering them at runtime with `next/og` pulled satori into the Worker along with `resvg.wasm` (~519 KiB gzipped) and
`yoga.wasm` (~28 KiB), which pushed the bundle to ~3.2 MiB and over the 3 MiB Free-plan limit. `@opennextjs/cloudflare`
already aliases that library away when bundling the server function but not the middleware, so
`scripts/patch-opennext-og-worker.mjs` adds the missing alias. It runs on `postinstall`; if a future OpenNext release
changes that file the script reports and skips instead of failing the install, and `npx wrangler deploy --dry-run` will
show the bundle growing again.

## GitHub repository

This checkout's `origin` points at https://github.com/AntonKuznetsov1/my_portfolio, which is where the portfolio now
lives. It previously pointed at the template owner's repository, so use the `my_portfolio` URL when cloning fresh.

The pushed history still contains commits inherited from the template project, so the public repository is not a
from-scratch history.
