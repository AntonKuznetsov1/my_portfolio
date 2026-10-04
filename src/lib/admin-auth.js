import { createHmac, timingSafeEqual, createHash } from 'node:crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'portfolio_admin'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function digest(value) {
  return createHash('sha256').update(String(value)).digest()
}

function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET)
}

/**
 * Constant-time comparison of the submitted password against ADMIN_PASSWORD.
 * Both sides are hashed first so the buffers are always the same length, which
 * is what timingSafeEqual requires.
 */
export function verifyPassword(input) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || typeof input !== 'string' || !input) return false
  return timingSafeEqual(digest(input), digest(expected))
}

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url')
  const signature = sign(payload)
  if (!signature) return null
  return `${payload}.${signature}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false

  const separator = token.lastIndexOf('.')
  if (separator <= 0) return false

  const payload = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = sign(payload)
  if (!expected) return false

  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return false

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

export async function getSession() {
  if (!isAdminConfigured()) return null
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!verifySessionToken(token)) return null
  return { authenticated: true }
}

export function isAdminEnabled() {
  return isAdminConfigured()
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE,
  options: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
}

/**
 * Rate limits password guesses per client address. Best effort: a serverless
 * isolate can be recycled at any time, which resets the counter. The password
 * itself is the real control here.
 */
const MAX_ATTEMPTS = 8
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map()

export function isRateLimited(address) {
  const now = Date.now()
  const key = address ?? 'unknown'
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS })
    return false
  }

  return entry.count >= MAX_ATTEMPTS
}

export function recordFailedAttempt(address) {
  const now = Date.now()
  const key = address ?? 'unknown'
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  entry.count += 1
}

export function clearAttempts(address) {
  attempts.delete(address ?? 'unknown')
}
