'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import {
  clearAttempts,
  createSessionToken,
  getSession,
  isAdminEnabled,
  isRateLimited,
  recordFailedAttempt,
  sessionCookie,
  verifyPassword
} from '@/lib/admin-auth'
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/admin-supabase'
import { removeImage } from '@/lib/upload'
import { uniqueSlug } from '@/lib/utils'

const MAX_TITLE = 160
const MAX_DESCRIPTION = 600
const MAX_BODY = 100000
const MAX_PRICE = 60
const MAX_IMAGES = 20
const MAX_IMAGE_URL_LENGTH = 1000

/**
 * Server Functions are reachable by a direct POST, so proxy.js is not enough.
 * Every action re-checks the session before touching anything.
 */
async function requireSession() {
  const session = await getSession()
  if (!session) return null

  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment.' }
  }

  return { ok: true }
}

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Storage objects live under "<scope>/<recordId>/<uuid>.<ext>". Anything else is
 * rejected so a crafted URL or path can never delete an unrelated bucket object.
 */
function isManagedPath(path, scope) {
  return (
    typeof path === 'string' && new RegExp(`^${scope}/[a-zA-Z0-9-]{1,64}/[a-zA-Z0-9-]+\\.[a-z0-9]{2,5}$`).test(path)
  )
}

function isManagedPathAnywhere(path) {
  return isManagedPath(path, 'posts') || isManagedPath(path, 'projects')
}

/**
 * Last resort for rows written before `path` existed: recover the storage key
 * from the public URL. `path` is preferred wherever it is available.
 */
function pathFromUrl(url) {
  return typeof url === 'string' ? url.split('/storage/v1/object/public/portfolio/')[1] ?? null : null
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return []

  const cleaned = images
    .slice(0, MAX_IMAGES)
    .map((image, index) => ({
      url: clean(image?.url, MAX_IMAGE_URL_LENGTH),
      path: isManagedPath(image?.path, 'posts') || isManagedPath(image?.path, 'projects') ? image.path : null,
      alt: clean(image?.alt, 160),
      is_cover: Boolean(image?.is_cover),
      position: index
    }))
    .filter((image) => isHttpUrl(image.url))

  // Public queries pick the first cover, or the first image as a fallback, so
  // exactly one row has to carry the flag — but honour the one the user chose
  // rather than always promoting the first upload.
  if (cleaned.length) {
    const chosen = cleaned.findIndex((image) => image.is_cover)
    const coverIndex = chosen === -1 ? 0 : chosen
    cleaned.forEach((image, index) => {
      image.is_cover = index === coverIndex
    })
  }

  return cleaned
}

/**
 * Reconciles the stored image rows with what the form holds.
 *
 * Rows are matched on url, so an image that was only reordered or re-captioned
 * keeps its id and created_at instead of being deleted and reinserted. The rows
 * that dropped out are returned rather than cleaned up here, so the caller can
 * remove their storage objects only after the database write has landed —
 * purging first meant a failed save could destroy images the post still needed.
 */
async function syncImages({ table, column, recordId, images }) {
  const { data: existing, error: readError } = await getAdminSupabase()
    .from(table)
    .select('id, url, path, alt, is_cover, position')
    .eq(column, recordId)

  if (readError) return { error: 'The images could not be read back.' }

  const existingByUrl = new Map((existing ?? []).map((row) => [row.url, row]))
  const keptUrls = new Set(images.map((image) => image.url))
  const removed = (existing ?? []).filter((row) => !keptUrls.has(row.url))

  const inserts = []
  const updates = []

  for (const image of images) {
    const next = {
      url: image.url,
      path: image.path,
      alt: image.alt || null,
      is_cover: image.is_cover,
      position: image.position
    }

    const row = existingByUrl.get(image.url)

    if (!row) {
      inserts.push({ [column]: recordId, ...next })
      continue
    }

    const changed =
      (row.alt ?? null) !== next.alt ||
      Boolean(row.is_cover) !== next.is_cover ||
      (row.position ?? 0) !== next.position ||
      (row.path ?? null) !== next.path

    // The parent key travels with the update even though it is unchanged.
    // An upsert is an INSERT with ON CONFLICT DO UPDATE, and Postgres checks
    // NOT NULL on the proposed row before the conflict ever fires — leaving
    // post_id/project_id out fails with 23502 instead of updating.
    if (changed) updates.push({ id: row.id, [column]: recordId, ...next })
  }

  if (inserts.length) {
    const { error } = await getAdminSupabase().from(table).insert(inserts)
    if (error) return { error: 'The images could not be saved.' }
  }

  if (updates.length) {
    const { error } = await getAdminSupabase().from(table).upsert(updates)
    if (error) return { error: 'The images could not be saved.' }
  }

  if (removed.length) {
    const { error } = await getAdminSupabase()
      .from(table)
      .delete()
      .in(
        'id',
        removed.map((row) => row.id)
      )

    if (error) return { error: 'The removed images could not be cleaned up.' }
  }

  return { removed }
}

/** Deletes the storage objects behind image rows that are no longer referenced. */
async function purgeImages(rows) {
  for (const row of rows) {
    const candidate = isManagedPathAnywhere(row.path) ? row.path : pathFromUrl(row.url)
    if (!isManagedPathAnywhere(candidate)) continue

    await removeImage(decodeURIComponent(candidate))
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function login(password) {
  if (!isAdminEnabled()) return { ok: false, error: 'The admin area is not configured on this deployment.' }

  const headerList = await headers()
  const address = headerList.get('cf-connecting-ip') ?? headerList.get('x-forwarded-for')?.split(',')[0]?.trim()

  if (isRateLimited(address)) {
    return { ok: false, error: 'Too many attempts. Wait fifteen minutes and try again.' }
  }

  if (!verifyPassword(password)) {
    recordFailedAttempt(address)
    await new Promise((resolve) => setTimeout(resolve, 400))
    return { ok: false, error: 'That password was not accepted.' }
  }

  clearAttempts(address)

  const token = createSessionToken()
  if (!token) return { ok: false, error: 'The admin area is not configured on this deployment.' }

  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, token, { ...sessionCookie.options, maxAge: sessionCookie.maxAge })

  return { ok: true }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, '', { ...sessionCookie.options, maxAge: 0 })
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function savePost(payload) {
  const guard = await requireSession()
  if (!guard?.ok) return guard

  const title = clean(payload?.title, MAX_TITLE)
  const description = clean(payload?.description, MAX_DESCRIPTION)
  const body = clean(payload?.body, MAX_BODY)
  const images = normalizeImages(payload?.images)

  if (!title && !description && !body && !images.length) {
    return { ok: false, error: 'Add a title, a description, a body or an image before saving.' }
  }

  if (payload?.id) {
    const { data: existing, error: lookupError } = await getAdminSupabase()
      .from('posts')
      .select('id, slug')
      .eq('id', payload.id)
      .limit(1)

    if (lookupError || !existing?.length) return { ok: false, error: 'That post no longer exists.' }

    const { error } = await getAdminSupabase()
      .from('posts')
      .update({ title: title || null, description: description || null, body: body || null, updated_at: new Date() })
      .eq('id', payload.id)

    if (error) return { ok: false, error: 'The post could not be saved.' }

    const sync = await syncImages({ table: 'post_images', column: 'post_id', recordId: payload.id, images })
    if (sync.error) return { ok: false, error: sync.error }

    await purgeImages(sync.removed)

    revalidatePath('/')
    revalidatePath('/writing')
    revalidatePath(`/writing/${existing[0].slug}`)

    return { ok: true, slug: existing[0].slug }
  }

  const { data: slugs } = await getAdminSupabase().from('posts').select('slug')
  const slug = uniqueSlug(
    title || description || body.slice(0, 40) || 'post',
    (slugs ?? []).map((row) => row.slug)
  )

  const { data: created, error } = await getAdminSupabase()
    .from('posts')
    .insert({ slug, title: title || null, description: description || null, body: body || null })
    .select('id')
    .limit(1)

  if (error || !created?.length) return { ok: false, error: 'The post could not be created.' }

  const sync = await syncImages({ table: 'post_images', column: 'post_id', recordId: created[0].id, images })
  if (sync.error) return { ok: false, error: sync.error }

  revalidatePath('/')
  revalidatePath('/writing')
  revalidatePath(`/writing/${slug}`)

  return { ok: true, slug }
}

export async function deletePost(id) {
  const guard = await requireSession()
  if (!guard?.ok) return guard

  const { data: existing } = await getAdminSupabase().from('posts').select('id, slug').eq('id', id).limit(1)
  if (!existing?.length) return { ok: false, error: 'That post no longer exists.' }

  // Read the image keys first, but delete the row before touching storage: the
  // rows cascade with the post, so a failed delete must not leave the files gone.
  const { data: stored } = await getAdminSupabase().from('post_images').select('url, path').eq('post_id', id)

  const { error } = await getAdminSupabase().from('posts').delete().eq('id', id)
  if (error) return { ok: false, error: 'The post could not be deleted.' }

  await purgeImages(stored ?? [])

  revalidatePath('/')
  revalidatePath('/writing')
  revalidatePath(`/writing/${existing[0].slug}`)

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function saveProject(payload) {
  const guard = await requireSession()
  if (!guard?.ok) return guard

  const title = clean(payload?.title, MAX_TITLE)
  const description = clean(payload?.description, MAX_DESCRIPTION)
  const projectUrl = clean(payload?.project_url, MAX_IMAGE_URL_LENGTH)
  const githubUrl = clean(payload?.github_url, MAX_IMAGE_URL_LENGTH)
  const price = clean(payload?.price, MAX_PRICE)
  const images = normalizeImages(payload?.images)

  if (!projectUrl) return { ok: false, error: 'A project link is required.' }
  if (!isHttpUrl(projectUrl)) return { ok: false, error: 'The project link needs to be a full URL.' }
  if (githubUrl && !isHttpUrl(githubUrl)) return { ok: false, error: 'The GitHub link needs to be a full URL.' }

  if (payload?.id) {
    const { data: existing } = await getAdminSupabase()
      .from('projects')
      .select('id, slug')
      .eq('id', payload.id)
      .limit(1)

    if (!existing?.length) return { ok: false, error: 'That project no longer exists.' }

    const { error } = await getAdminSupabase()
      .from('projects')
      .update({
        title: title || null,
        description: description || null,
        project_url: projectUrl,
        github_url: githubUrl || null,
        price: price || null,
        updated_at: new Date()
      })
      .eq('id', payload.id)

    if (error) return { ok: false, error: 'The project could not be saved.' }

    const sync = await syncImages({
      table: 'project_images',
      column: 'project_id',
      recordId: payload.id,
      images
    })
    if (sync.error) return { ok: false, error: sync.error }

    await purgeImages(sync.removed)

    revalidatePath('/projects')
    revalidatePath(`/projects/${existing[0].slug}`)

    return { ok: true, slug: existing[0].slug }
  }

  const { data: slugs } = await getAdminSupabase().from('projects').select('slug')
  const slug = uniqueSlug(
    title || projectUrl,
    (slugs ?? []).map((row) => row.slug)
  )

  const { data: existingPositions } = await getAdminSupabase().from('projects').select('position')
  const position = (existingPositions ?? []).reduce((max, row) => Math.max(max, row.position ?? 0), 0) + 1

  const { data: created, error } = await getAdminSupabase()
    .from('projects')
    .insert({
      slug,
      title: title || null,
      description: description || null,
      project_url: projectUrl,
      github_url: githubUrl || null,
      price: price || null,
      position
    })
    .select('id')
    .limit(1)

  if (error || !created?.length) return { ok: false, error: 'The project could not be created.' }

  const sync = await syncImages({
    table: 'project_images',
    column: 'project_id',
    recordId: created[0].id,
    images
  })
  if (sync.error) return { ok: false, error: sync.error }

  revalidatePath('/projects')
  revalidatePath(`/projects/${slug}`)

  return { ok: true, slug }
}

export async function deleteProject(id) {
  const guard = await requireSession()
  if (!guard?.ok) return guard

  const { data: existing } = await getAdminSupabase().from('projects').select('id, slug').eq('id', id).limit(1)
  if (!existing?.length) return { ok: false, error: 'That project no longer exists.' }

  const { data: stored } = await getAdminSupabase().from('project_images').select('url, path').eq('project_id', id)

  const { error } = await getAdminSupabase().from('projects').delete().eq('id', id)
  if (error) return { ok: false, error: 'The project could not be deleted.' }

  await purgeImages(stored ?? [])

  revalidatePath('/projects')
  revalidatePath(`/projects/${existing[0].slug}`)

  return { ok: true }
}

/** Reads one record plus its images, for the edit screens. */
export async function getPostForAdmin(id) {
  const guard = await requireSession()
  if (!guard?.ok) return null

  const { data } = await getAdminSupabase()
    .from('posts')
    .select(
      'id, slug, title, description, body, published_at, like_count, post_images(url, path, alt, is_cover, position)'
    )
    .eq('id', id)
    .limit(1)

  const post = data?.[0]
  if (!post) return null

  const { post_images, ...rest } = post
  return { post: rest, images: (post_images ?? []).sort((a, b) => a.position - b.position) }
}

export async function getProjectForAdmin(id) {
  const guard = await requireSession()
  if (!guard?.ok) return null

  const { data } = await getAdminSupabase()
    .from('projects')
    .select(
      'id, slug, title, description, project_url, github_url, price, published_at, position, project_images(url, path, alt, is_cover, position)'
    )
    .eq('id', id)
    .limit(1)

  const project = data?.[0]
  if (!project) return null

  const { project_images, ...rest } = project
  return { project: rest, images: (project_images ?? []).sort((a, b) => a.position - b.position) }
}

/** Dashboard lists, including drafts. Service role, so it bypasses RLS. */
export async function getAdminOverview() {
  const guard = await requireSession()
  if (!guard?.ok) return { posts: [], projects: [], configured: false }

  const client = getAdminSupabase()
  if (!client) return { posts: [], projects: [], configured: false }

  const [posts, projects] = await Promise.all([
    client
      .from('posts')
      .select('id, slug, title, published_at, like_count, post_images(id)')
      .order('published_at', { ascending: false }),
    client
      .from('projects')
      .select('id, slug, title, price, published_at, project_images(id)')
      .order('position', { ascending: true })
  ])

  return {
    configured: true,
    posts: (posts.data ?? []).map(({ post_images, ...post }) => ({
      ...post,
      image_count: post_images?.length ?? 0
    })),
    projects: (projects.data ?? []).map(({ project_images, ...project }) => ({
      ...project,
      image_count: project_images?.length ?? 0
    }))
  }
}
