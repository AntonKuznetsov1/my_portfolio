/**
 * The canonical origin, used for metadataBase, the sitemap and robots.txt.
 * Trailing slashes are stripped so callers can safely append `/path`.
 */
const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://antonkuz.com'

export const SITE_URL = raw.replace(/\/+$/, '')
