/**
 * Makes worker-mailer's `cloudflare:sockets` import work in the running Worker.
 *
 * worker-mailer imports `connect` from `cloudflare:sockets`. Turbopack bundles
 * that into a server chunk as:
 *
 *   t.x("cloudflare:sockets", () => require("cloudflare:sockets"), true)
 *
 * workerd resolves `cloudflare:sockets` through ESM imports but explicitly does
 * not support `require()` of it ("Dynamic require of cloudflare:sockets is not
 * supported"), so instantiating the mailer throws and the contact endpoint 500s
 * as soon as SMTP_PASS is present.
 *
 * This script edits the OpenNext output after `opennextjs-cloudflare build`:
 * it injects a real ESM import of `cloudflare:sockets` at the top of the server
 * handler and swaps the Turbopack external-require helper call for that
 * namespace. Wrangler keeps `cloudflare:*` imports as external when it bundles,
 * so the import survives into the deployed Worker.
 *
 * Idempotent. Never fails an install: a missing anchor prints a warning on
 * stderr and exits 0. Runs after the adapter build; add it to the deploy and
 * preview scripts so hand edits cannot drift.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const MARKER = 'patch-opennext-runtime-sockets'
const NAMESPACE = '__cloudflare_sockets_runtime'
const IMPORT_LINE = `import * as ${NAMESPACE} from "cloudflare:sockets";`

// The Turbopack runtime helper that lazily require()s an external module.
// The module id is its own module name, which minification does not rename.
const HELPER_CALL = /[\w$]+\.x\("cloudflare:sockets",\(\)=>require\("cloudflare:sockets"\),!0\)/g

function patch(relative, optional) {
  const target = resolve(ROOT, relative)

  let source
  try {
    source = readFileSync(target, 'utf8')
  } catch {
    if (optional) return
    console.warn(`[${MARKER}] ${relative}: not found.`)
    return
  }

  if (source.includes(MARKER)) {
    console.log(`[${MARKER}] ${relative}: already applied.`)
    return
  }

  const matches = source.match(HELPER_CALL) || []
  if (matches.length === 0) {
    if (source.includes('worker-mailer') || source.includes('require("cloudflare:sockets")')) {
      console.warn(
        `[${MARKER}] ${relative}: mailer references present but the helper pattern changed.\n` +
          '  The contact endpoint may throw "Dynamic require of cloudflare:sockets".'
      )
    }
    return
  }

  if (matches.length > 1) {
    console.warn(
      `[${MARKER}] ${relative}: found ${matches.length} helper calls, expected 1. Applying anyway.`
    )
  }

  const annotated = `// ${MARKER}: replace the Turbopack require helper with the native ESM import.\n  ${NAMESPACE}`
  source = source.replace(HELPER_CALL, annotated)

  // Place the import right after the first top-level import statement so it
  // sits before any executable code but after whatever the bundler put first.
  const firstImportEnd = source.indexOf('import ')
  const firstNewline = source.indexOf('\n', firstImportEnd)
  source =
    source.slice(0, firstNewline + 1) +
    `${IMPORT_LINE}\n` +
    source.slice(firstNewline + 1)

  writeFileSync(target, source, 'utf8')
  console.log(`[${MARKER}] patched ${relative} (${matches.length} helper call).`)
}

function main() {
  patch('.open-next/server-functions/default/handler.mjs', false)
  patch('.open-next/middleware/handler.mjs', true)
}

main()