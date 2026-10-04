import { NextResponse } from 'next/server'

import { getSession } from '@/lib/admin-auth'
import { isSupabaseConfigured } from '@/lib/admin-supabase'
import { removeImage } from '@/lib/upload'

const noIndex = { 'X-Robots-Tag': 'noindex, nofollow' }

const MANAGED_PATH = /^(posts|projects)\/[a-zA-Z0-9-]{1,64}\/[a-zA-Z0-9-]+\.[a-z0-9]{2,5}$/

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: noIndex })

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503, headers: noIndex })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'The request could not be read.' }, { status: 400, headers: noIndex })
  }

  const path = typeof body?.path === 'string' ? body.path : ''
  if (!MANAGED_PATH.test(path)) {
    return NextResponse.json({ error: 'Unknown file.' }, { status: 400, headers: noIndex })
  }

  await removeImage(path)
  return NextResponse.json({ ok: true })
}
