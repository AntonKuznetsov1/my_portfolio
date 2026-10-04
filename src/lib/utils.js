import { twMerge } from 'tailwind-merge'
import { cx } from 'classix'

export function cn(...args) {
  return twMerge(cx(...args))
}

export const isExternalLink = (href) => {
  if (!href) return false
  return !href.startsWith('/') && !href.startsWith('#')
}

// June 23, 1992
export const getDateTimeFormat = (date) => {
  const dateObj = new Date(date)
  return Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).format(dateObj)
}

export const dasherize = (text) => String(text).replace(/ +/g, '-').toLowerCase()

// URL-safe slug: strips accents and punctuation, collapses separators.
export const slugify = (text) =>
  String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

// Appends -2, -3, ... until the slug is free. `taken` is a list of existing slugs.
export const uniqueSlug = (text, taken = []) => {
  const base = slugify(text) || 'untitled'
  const used = new Set(taken)
  if (!used.has(base)) return base

  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0)

export const getHostname = (url) => {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export const isDevelopment = process.env.NODE_ENV === 'development'

export const sortByProperty = (arr, prop) => {
  return arr.sort((a, b) => {
    const itemA = a[prop].toUpperCase()
    const itemB = b[prop].toUpperCase()

    if (itemA < itemB) {
      return -1
    } else if (itemA > itemB) {
      return 1
    }

    return 0
  })
}
