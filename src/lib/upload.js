import { getAdminSupabase } from '@/lib/admin-supabase'

export const BUCKET_NAME = 'portfolio'

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif'
}

export function isAcceptedImage(file) {
  return Boolean(file) && ACCEPTED_IMAGE_TYPES.includes(file.type)
}

export function getImageExtension(file) {
  return EXTENSION_BY_TYPE[file?.type] ?? 'jpg'
}

/**
 * Uploads one image into `scope/<recordId>/` and returns its public URL.
 * The caller is always a session-guarded Route Handler, so the service role
 * key is the only thing that can write to this bucket.
 */
export async function uploadImage(file, scope, recordId) {
  const client = getAdminSupabase()
  if (!client) return { error: 'Supabase is not configured.' }
  if (!isAcceptedImage(file)) return { error: 'Only JPEG, PNG, WebP, AVIF or GIF images are supported.' }
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Images must be smaller than 5 MB.' }

  const safeId = String(recordId).replace(/[^a-zA-Z0-9-]/g, '')
  const name = `${crypto.randomUUID()}.${getImageExtension(file)}`
  const path = `${scope}/${safeId}/${name}`

  const { error } = await client.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false
  })

  if (error) return { error: 'The image could not be uploaded.' }

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** Removes a previously uploaded file. Safe to call with an already-deleted path. */
export async function removeImage(path) {
  const client = getAdminSupabase()
  if (!client || !path) return

  await client.storage.from(BUCKET_NAME).remove([path])
}
