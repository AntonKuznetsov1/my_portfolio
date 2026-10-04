import { NextResponse } from 'next/server'

import { getSession } from '@/lib/admin-auth'
import { isSupabaseConfigured } from '@/lib/admin-supabase'
import { uploadImage } from '@/lib/upload'

const ALLOWED_SCOPES = new Set(['posts', 'projects'])
const noIndex = { 'X-Robots-Tag': 'noindex, nofollow' }

export async function POST(request) {
  // proxy.js already rejects anonymous callers, but a route handler must never
  // rely on that alone.
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: noIndex })

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503, headers: noIndex })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'The upload could not be read.' }, { status: 400, headers: noIndex })
  }

  const file = formData.get('file')
  const scope = String(formData.get('scope') ?? '')
  const recordId = String(formData.get('recordId') ?? '')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No image was sent.' }, { status: 400, headers: noIndex })
  }

  if (!ALLOWED_SCOPES.has(scope)) {
    return NextResponse.json({ error: 'Unknown upload target.' }, { status: 400, headers: noIndex })
  }

  const { url, path, error } = await uploadImage(file, scope, recordId)
  if (error) return NextResponse.json({ error }, { status: 400, headers: noIndex })

  return NextResponse.json({ url, path })
}
