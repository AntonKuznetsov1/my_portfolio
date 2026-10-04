import { supabase } from '@/lib/supabase'
import { pickCover } from '@/lib/posts'

const PROJECT_COLUMNS =
  'id, slug, title, description, project_url, github_url, price, published_at, position, created_at, updated_at'

/** All published projects in their curated order. */
export async function getAllProjects() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('projects')
    .select(`${PROJECT_COLUMNS}, project_images(id, url, alt, is_cover, position)`)
    .order('position', { ascending: true })
    .order('published_at', { ascending: false })

  if (error || !data) return []

  return data.map(({ project_images, ...project }) => ({
    ...project,
    images: [...project_images].sort((a, b) => a.position - b.position),
    cover: pickCover(project_images)
  }))
}

export async function getProject(slug) {
  if (!supabase || !slug) return undefined

  const { data, error } = await supabase
    .from('projects')
    .select(`${PROJECT_COLUMNS}, project_images(id, url, alt, is_cover, position)`)
    .eq('slug', slug)
    .limit(1)

  if (error || !data?.length) return undefined

  const { project_images, ...project } = data[0]
  return {
    ...project,
    images: [...project_images].sort((a, b) => a.position - b.position),
    cover: pickCover(project_images)
  }
}

export async function getAllProjectSlugs() {
  if (!supabase) return []

  const { data, error } = await supabase.from('projects').select('slug')
  if (error || !data) return []

  return data
}
