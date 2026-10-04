/**
 * Keeps the unused `next/og` runtime out of the OpenNext middleware bundle.
 *
 * OpenNext aliases `@vercel/og` to a throwing shim when bundling the server
 * function (see `patchVercelOgLibrary` in
 * `@opennextjs/cloudflare/dist/cli/build/bundle-server.js`), but the middleware
 * bundle in `open-next/bundle-node-middleware.js` has no such alias. Next.js emits
 * a lazy `import('next/dist/compiled/@vercel/og/index.node.js')` from its own
 * image-response helper, so the middleware bundle pulls in satori along with
 * `resvg.wasm` (~519 KiB gzipped) and `yoga.wasm` (~28 KiB). That pushed the
 * Worker to ~3.2 MiB compressed, over Cloudflare's 3 MiB limit on the Free plan.
 *
 * Open Graph images are pre-rendered to static PNGs by `scripts/generate-og.mjs`,
 * so nothing calls `ImageResponse` at runtime and the library is dead weight.
 *
 * This script inserts the missing alias. It is idempotent, refuses to guess if the
 * surrounding code has changed, and never fails an install: if the anchor is
 * missing it reports and exits 0 so a future OpenNext release cannot break
 * `npm install`. Run via `postinstall`; re-run manually with
 * `node scripts/patch-opennext-og-worker.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(ROOT, 'node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/bundle-node-middleware.js')

const MARKER = 'patch-opennext-og-worker'
const ANCHOR = '...(hasOpentelemetry ? {} : { "@opentelemetry/api": "next/dist/compiled/@opentelemetry/api" }),'

const PATCH = `
        // ${MARKER}: alias the unused @vercel/og runtime away so satori and its
        // resvg/yoga WebAssembly do not inflate the Worker past Cloudflare's 3 MiB
        // Free-plan limit. Open Graph images are pre-rendered by scripts/generate-og.mjs.
        "next/dist/compiled/@vercel/og/index.node.js": path.resolve(process.cwd(), "scripts/og-worker-shim.js"),
        "next/dist/compiled/@vercel/og/index.edge.js": path.resolve(process.cwd(), "scripts/og-worker-shim.js"),`

function main() {
  let source
  try {
    source = readFileSync(TARGET, 'utf8')
  } catch {
    console.log('[patch-opennext-og-worker] skipped: @opennextjs/cloudflare is not installed yet.')
    return
  }

  if (source.includes(MARKER)) {
    console.log('[patch-opennext-og-worker] already applied.')
    return
  }

  const index = source.indexOf(ANCHOR)
  if (index === -1) {
    console.warn(
      '[patch-opennext-og-worker] skipped: could not find the alias anchor in bundle-node-middleware.js.\n' +
        '  The middleware bundle may once again pull in @vercel/og. Check the compressed\n' +
        '  Worker size (npx wrangler deploy --dry-run) against the 3 MiB Free-plan limit.'
    )
    return
  }

  const insertAt = index + ANCHOR.length
  writeFileSync(TARGET, source.slice(0, insertAt) + PATCH + source.slice(insertAt), 'utf8')
  console.log('[patch-opennext-og-worker] applied: @vercel/og aliased away in the middleware bundle.')
}

main()
