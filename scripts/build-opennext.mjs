/**
 * Builds the OpenNext Worker bundle without baking secrets into it.
 *
 * Secrets reach the deployed Worker in two ways that can leak:
 *  1. `.env.local` is inlined into `next-env.mjs` during `next build`, and
 *  2. `.dev.vars` is inlined into `.open-next/cloudflare/next-env.mjs` during
 *     `opennextjs-cloudflare build`.
 *
 * The right source of truth in production is `wrangler secret put` (or
 * `[vars]` in wrangler.jsonc for non-secrets). The OpenNext runtime merges the
 * actual runtime bindings into `process.env` first and only fills gaps from
 * `next-env.mjs` with `??=`, so an empty baked map never overrides a real
 * binding.
 *
 * This script swaps both files for versions that keep only `NEXT_PUBLIC_*`
 * (plus `NEXTJS_ENV`, which is not a secret and selects the env mode), runs the
 * Next build, the OpenNext adapter build and the runtime sockets patch, then
 * restores the original files even if a step fails.
 *
 * Usage: `node scripts/build-opennext.mjs`  (exits non-zero on failure)
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, copyFileSync, rmSync, existsSync, chmodSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILES = ['.env.local', '.dev.vars']
const ALLOWED_PREFIXES = ['NEXT_PUBLIC_', 'NEXTJS_ENV']

let failed = false

function strip(source) {
  return source
    .split('\n')
    .map((line) => {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
      if (!match) return line
      const name = match[1]
      if (ALLOWED_PREFIXES.some((p) => name.startsWith(p))) return line
      return `${name}=`
    })
    .join('\n')
}

for (const file of FILES) {
  const path = resolve(ROOT, file)
  if (!existsSync(path)) {
    console.error(`[build-opennext] ${file} not found. Aborting.`)
    process.exit(1)
  }
}

function restore() {
  for (const file of FILES) {
    const backup = resolve(ROOT, `${file}.build.bak`)
    try {
      if (existsSync(backup)) {
        copyFileSync(backup, resolve(ROOT, file))
        chmodSync(resolve(ROOT, file), 0o600)
        rmSync(backup, { force: true })
        console.log(`[build-opennext] ${file} restored.`)
      }
    } catch (error) {
      console.error(`[build-opennext] restore failed for ${file}. Keep ${backup}:`, error.message)
      failed = true
    }
  }
}

// Stash originals, write stripped versions in place.
for (const file of FILES) {
  const path = resolve(ROOT, file)
  const backup = resolve(ROOT, `${file}.build.bak`)
  copyFileSync(path, backup)
  chmodSync(backup, 0o600)
  writeFileSync(path, strip(readFileSync(path, 'utf8')), 'utf8')
  chmodSync(path, 0o600)
}

function run(cmd, args, env) {
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: env ?? process.env })
  if (result.status !== 0) {
    console.error(`[build-opennext] step failed: ${cmd} ${args.join(' ')}`)
    restore()
    process.exit(result.status ?? 1)
  }
}

try {
  const buildEnv = {
    ...process.env,
    NEXT_PRIVATE_STANDALONE: 'true',
    NEXT_PRIVATE_OUTPUT_TRACE_ROOT: ROOT
  }
  run('npm', ['run', 'build'], buildEnv)
  run('npx', ['opennextjs-cloudflare', 'build', '--skipNextBuild'])
  run('node', ['scripts/patch-opennext-runtime-sockets.mjs'])
  restore()
  if (!failed) console.log('[build-opennext] done.')
  process.exit(failed ? 1 : 0)
} catch (error) {
  console.error('[build-opennext] unexpected failure:', error.message)
  restore()
  process.exit(1)
}