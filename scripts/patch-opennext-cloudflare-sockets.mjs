/**
 * Teaches the OpenNext bundler that `cloudflare:sockets` is external.
 *
 * `worker-mailer`, used by `src/lib/contact-email.js` to speak SMTP from the
 * Worker, imports `connect()` from `cloudflare:sockets`. That module is provided
 * by the runtime and has no file on disk, so esbuild cannot resolve it and fails
 * the build with:
 *
 *   Could not resolve "cloudflare:sockets"
 *
 * Marking it external leaves the bare `import` in the bundle, which workerd
 * resolves itself at run time.
 *
 * This mirrors what the adapter already does for `cloudflare:workers` in
 * `compileDurableObjects.js`, and for `node:*` in `bundle-node-middleware.js`.
 *
 * Idempotent, refuses to guess if the surrounding code has changed, and never
 * fails an install: a missing anchor reports and exits 0 so a future OpenNext
 * release cannot break `npm install`. Run via `postinstall`; re-run manually with
 * `node scripts/patch-opennext-cloudflare-sockets.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BUILD = resolve(ROOT, 'node_modules/@opennextjs/cloudflare/dist/cli/build')

const MARKER = 'patch-opennext-cloudflare-sockets'

// Each entry is the file to edit plus the exact text to extend. The server bundle
// is where worker-mailer actually lands; the middleware bundle is patched too
// because the contact route can be pulled in through either path.
const TARGETS = [
  {
    // This is the bundler that actually pulls in the app's own code, so it is the
    // one that fails without the patch. The other two are patched defensively so
    // the import survives no matter which path a route is bundled through.
    file: 'bundle-server.js',
    anchor: 'external: ["./middleware/handler.mjs"],',
    replacement: 'external: ["./middleware/handler.mjs", "cloudflare:sockets"],'
  },
  {
    file: 'open-next/createServerBundle.js',
    anchor: 'external: ["./middleware.mjs"],',
    replacement: 'external: ["./middleware.mjs", "cloudflare:sockets"],'
  },
  {
    file: 'open-next/bundle-node-middleware.js',
    anchor: 'external: ["node:*", "./open-next.config.mjs"],',
    replacement: 'external: ["node:*", "./open-next.config.mjs", "cloudflare:sockets"],'
  }
]

function patch({ file, anchor, replacement }) {
  const target = resolve(BUILD, file)

  let source
  try {
    source = readFileSync(target, 'utf8')
  } catch {
    console.log(`[${MARKER}] skipped ${file}: not found.`)
    return
  }

  if (source.includes(MARKER)) {
    console.log(`[${MARKER}] ${file}: already applied.`)
    return
  }

  if (!source.includes(anchor)) {
    console.warn(
      `[${MARKER}] skipped ${file}: anchor not found.\n` +
        '  worker-mailer will fail to bundle with "Could not resolve cloudflare:sockets".\n' +
        '  Check whether the OpenNext build step changed in an upgrade.'
    )
    return
  }

  writeFileSync(
    target,
    source.replace(
      anchor,
      `// ${MARKER}: cloudflare:sockets is a runtime module, not a file on disk.\n          ${replacement}`
    ),
    'utf8'
  )
  console.log(`[${MARKER}] applied to ${file}.`)
}

function main() {
  let exists = true
  try {
    readFileSync(resolve(BUILD, 'bundle-server.js'), 'utf8')
  } catch {
    exists = false
    console.log(`[${MARKER}] skipped: @opennextjs/cloudflare is not installed yet.`)
  }
  if (!exists) return

  for (const target of TARGETS) patch(target)
}

main()
