/**
 * Pre-renders the Open Graph / favicon images to static PNG files.
 *
 * These used to be runtime routes built on `next/og`, which pulls satori plus
 * the resvg and yoga WebAssembly binaries into the Cloudflare Worker. That
 * pushed the compressed Worker past the 3 MiB limit on the Free plan, so the
 * images are now rasterised here at build time and served as plain static
 * metadata files instead. Run with `npm run generate:og`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const WIDTH = 1200
const HEIGHT = 630

const BG = '#171719'
const GRID = '#f0a878'
const GRID_OPACITY = 0x12 / 0xff
const PILL_BG = '#29292d'
const TITLE = '#ffffff'
const BODY = '#d4d4d8'

const FONT = 'DejaVu Sans'

/* Lucide icons, 24x24 viewBox, stroked with `currentColor`. */
const ICONS = {
  sparkles:
    '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  penTool:
    '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  send: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function grid() {
  const lines = []
  for (let x = 0; x <= WIDTH; x += 24) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}"/>`)
  }
  for (let y = 0; y <= HEIGHT; y += 24) {
    lines.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}"/>`)
  }
  return `<g stroke="${GRID}" stroke-opacity="${GRID_OPACITY}" stroke-width="1">${lines.join('')}</g>`
}

function icon(name, { x, y, size, color }) {
  if (!name) return ''
  const body = ICONS[name] ?? ''
  if (!body) return ''
  const scale = size / 24
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g>`
}

/** Greedy wrap on an estimated average glyph width, so long copy stays inside the safe area. */
function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

function ogSvg({ title, description, url, icon: iconName }) {
  const PAD = 60
  const TITLE_SIZE = 84
  const DESC_SIZE = 40
  const DESC_GAP = 8
  const ICON_SIZE = 64
  const ICON_GAP = 16

  const pillText = url ? `Anton Kuznetsov / ${url}` : 'Anton Kuznetsov'
  const pillFontSize = 40
  const pillPadX = 28
  const pillHeight = 72
  const pillWidth = Math.round(pillText.length * pillFontSize * 0.55) + pillPadX * 2

  const textWidth = WIDTH - PAD * 2 - (iconName ? ICON_SIZE + ICON_GAP : 0)
  const titleLines = wrap(title, Math.floor(textWidth / (TITLE_SIZE * 0.53)))
  const descLines = description ? wrap(description, Math.floor((WIDTH * 0.8 - PAD) / (DESC_SIZE * 0.53))) : []

  const titleLineHeight = TITLE_SIZE
  const descLineHeight = 44
  const blockHeight =
    titleLines.length * titleLineHeight + (descLines.length ? DESC_GAP + descLines.length * descLineHeight : 0)
  const blockTop = HEIGHT - PAD - blockHeight

  const parts = []
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>`)
  parts.push(grid())
  parts.push(
    `<rect x="${PAD}" y="${PAD}" width="${pillWidth}" height="${pillHeight}" rx="${
      pillHeight / 2
    }" fill="${PILL_BG}"/>`,
    `<text x="${PAD + pillPadX}" y="${
      PAD + pillHeight / 2
    }" dominant-baseline="central" font-family="${FONT}" font-size="${pillFontSize}" fill="${TITLE}">${escapeXml(
      pillText
    )}</text>`
  )

  if (iconName) {
    const titleTop = blockTop + (titleLines.length * titleLineHeight) / 2 - ICON_SIZE / 2
    parts.push(icon(iconName, { x: PAD, y: titleTop, size: ICON_SIZE, color: GRID }))
  }

  const textX = PAD + (iconName ? ICON_SIZE + ICON_GAP : 0)
  const firstBaseline =
    blockTop + titleLines.length * titleLineHeight - (titleLines.length - 1) * titleLineHeight * 0.12
  parts.push(
    titleLines
      .map(
        (line, index) =>
          `<text x="${textX}" y="${
            firstBaseline + index * titleLineHeight
          }" font-family="${FONT}" font-size="${TITLE_SIZE}" font-weight="bold" fill="${TITLE}">${escapeXml(
            line
          )}</text>`
      )
      .join('')
  )

  if (descLines.length) {
    const descTop = blockTop + titleLines.length * titleLineHeight + DESC_GAP
    parts.push(
      descLines
        .map(
          (line, index) =>
            `<text x="${PAD}" y="${
              descTop + (index + 1) * descLineHeight - 12
            }" font-family="${FONT}" font-size="${DESC_SIZE}" fill="${BODY}">${escapeXml(line)}</text>`
        )
        .join('')
    )
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join(
    ''
  )}</svg>`
}

const IMAGES = [
  {
    out: 'src/app/opengraph-image.png',
    title: 'Anton Kuznetsov',
    description: 'Web developer, website designer, full-stack developer, and cybersecurity student.',
    icon: 'sparkles'
  },
  {
    out: 'src/app/[slug]/opengraph-image.png',
    title: 'Stack',
    description: 'Projects, experiments, and things I have built.',
    url: 'stack',
    icon: 'penTool'
  },
  {
    out: 'src/app/writing/opengraph-image.png',
    title: 'Writing',
    description: 'Articles and notes',
    url: 'writing',
    icon: 'pen'
  },
  {
    out: 'src/app/writing/[slug]/opengraph-image.png',
    title: 'Writing',
    description: 'Articles and notes by Anton Kuznetsov',
    url: 'writing',
    icon: 'pen'
  },
  {
    out: 'src/app/bookmarks/opengraph-image.png',
    title: 'Bookmarks',
    description: 'A collection of useful links and resources',
    url: 'bookmarks',
    icon: 'bookmark'
  },
  {
    out: 'src/app/bookmarks/[slug]/opengraph-image.png',
    title: 'Bookmarks',
    description: 'A curated selection of handpicked bookmarks',
    url: 'bookmarks',
    icon: 'bookmark'
  },
  {
    out: 'src/app/journey/opengraph-image.png',
    title: 'Journey',
    description: 'A timeline of projects and experiences',
    url: 'journey',
    icon: 'send'
  }
]

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#171719"/><path d="M 16 5 C 20 5 27 12 27 16 C 27 20 20 27 16 27 C 12 27 5 20 5 16 C 5 12 12 5 16 5 Z" fill="#f0a878"/></svg>`

async function renderPng(svg, out) {
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
  const target = resolve(ROOT, out)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, png)
  const kb = (png.length / 1024).toFixed(1)
  console.log(`  ${out}  ${kb} KiB`)
}

for (const image of IMAGES) {
  await renderPng(ogSvg(image), image.out)
}

await renderPng(ICON_SVG, 'src/app/icon.png')

console.log(`Generated ${IMAGES.length + 1} static metadata images.`)
