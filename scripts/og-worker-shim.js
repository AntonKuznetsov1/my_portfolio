/**
 * Worker-side stand-in for `next/og`.
 *
 * Open Graph images are pre-rendered to static PNG files by `scripts/generate-og.mjs`,
 * so `ImageResponse` is never invoked at runtime. Next.js still emits a lazy
 * `import('next/dist/compiled/@vercel/og/index.node.js')` inside its own
 * image-response helper, and the OpenNext middleware bundle has no alias for it, so
 * the whole rasteriser (satori plus `resvg.wasm` at ~519 KiB gzipped and
 * `yoga.wasm` at ~28 KiB) ends up in the Cloudflare Worker — enough to exceed the
 * 3 MiB limit on the Free plan.
 *
 * `scripts/patch-opennext-og-worker.mjs` points that import here. This module is
 * only ever reached through an import that nothing calls, so failing loudly is
 * preferable to silently rendering a blank image.
 */
const message =
  'next/og is unavailable in this deployment. Open Graph images are pre-rendered by scripts/generate-og.mjs; run `npm run generate:og` instead.'

function unavailable() {
  throw new Error(message)
}

export const ImageResponse = unavailable
export default { ImageResponse: unavailable }
