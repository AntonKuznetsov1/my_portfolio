import { NextResponse } from 'next/server'

import { isAdminEnabled, sessionCookie, verifySessionToken } from '@/lib/admin-auth'

const LOGIN_PATH = '/admin/login'

/**
 * Next 16 renamed middleware to proxy. This runs before rendering, so it keeps
 * logged-out visitors out of /admin without booting React.
 *
 * It is a fast filter, not the whole defence. Server Functions are reachable by
 * direct POST, so every action and route handler re-checks the session itself.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl

  const noIndexHeaders = { 'X-Robots-Tag': 'noindex, nofollow' }

  if (!isAdminEnabled()) {
    return pathname.startsWith('/api/admin')
      ? NextResponse.json({ error: 'Admin is not configured.' }, { status: 503, headers: noIndexHeaders })
      : new NextResponse('Admin is not configured.', { status: 503, headers: noIndexHeaders })
  }

  if (pathname === LOGIN_PATH) {
    const alreadyIn = verifySessionToken(request.cookies.get(sessionCookie.name)?.value)
    if (alreadyIn) return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.next()
  }

  const isAuthenticated = verifySessionToken(request.cookies.get(sessionCookie.name)?.value)

  if (pathname.startsWith('/api/admin')) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: noIndexHeaders })
    }
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL(LOGIN_PATH, request.url)
    if (pathname !== '/admin') loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  for (const [key, value] of Object.entries(noIndexHeaders)) response.headers.set(key, value)
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}