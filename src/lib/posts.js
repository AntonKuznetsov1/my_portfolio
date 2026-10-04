import { supabase } from '@/lib/supabase'

const POST_COLUMNS = 'id, slug, title, description, published_at, like_count, created_at, updated_at'

function sortImages(images = []) {
  return [...images].sort((a, b) => a.position - b.position)
}

/**
 * The cover is whichever image is flagged as the cover, otherwise the first by
 * position. Keeps list pages to a single query.
 */
export function pickCover(images = []) {
  const ordered = sortImages(images)
  return ordered.find((image) => image.is_cover) ?? ordered[0] ?? null
}

/**
 * All published posts, newest first. Returns an empty list when Supabase is not
 * configured so the site still builds and renders its empty states.
 */
export async function getAllPosts() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('posts')
    .select(`${POST_COLUMNS}, post_images(id, url, alt, is_cover, position)`)
    .order('published_at', { ascending: false })

  if (error || !data) return []

  return data.map(({ post_images, ...post }) => ({
    ...post,
    // `date` is what WritingList and WritingLink already read.
    date: post.published_at,
    images: sortImages(post_images),
    cover: pickCover(post_images)
  }))
}

export async function getPost(slug) {
  if (!supabase || !slug) return undefined

  const { data, error } = await supabase
    .from('posts')
    .select(`${POST_COLUMNS}, body, post_images(id, url, alt, is_cover, position)`)
    .eq('slug', slug)
    .limit(1)

  if (error || !data?.length) return undefined

  const { post_images, ...post } = data[0]
  return {
    ...post,
    date: post.published_at,
    images: sortImages(post_images),
    cover: pickCover(post_images)
  }
}

export async function getAllPostSlugs() {
  if (!supabase) return []

  const { data, error } = await supabase.from('posts').select('slug')
  if (error || !data) return []

  return data
}