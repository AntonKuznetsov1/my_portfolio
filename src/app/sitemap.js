import { getAllPageSlugs } from '@/lib/contentful'
import { getAllPosts } from '@/lib/posts'
import { getAllProjects } from '@/lib/projects'
import { SITE_URL } from '@/lib/site-url'

/**
 * Routes that always exist. Anything backed by Supabase or Contentful is
 * appended below, so an empty database still yields a valid sitemap.
 */
const STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/projects', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/writing', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/skills', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/journey', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/bookmarks', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' }
]

/** An unparseable timestamp would make Next throw while rendering the feed. */
function toDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default async function sitemap() {
  const [posts, projects, contentfulPages] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
    getAllPageSlugs().catch(() => [])
  ])

  const entries = STATIC_ROUTES.map(({ path, ...rest }) => ({
    url: `${SITE_URL}${path}`,
    ...rest
  }))

  for (const post of posts) {
    entries.push({
      url: `${SITE_URL}/writing/${post.slug}`,
      lastModified: toDate(post.date),
      changeFrequency: 'monthly',
      priority: 0.8
    })
  }

  for (const project of projects) {
    entries.push({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: toDate(project.published_at ?? project.created_at),
      changeFrequency: 'monthly',
      priority: 0.8
    })
  }

  // Contentful pages live at the site root. Slugs that have a dedicated route
  // (for example /journey) are already covered above.
  for (const page of contentfulPages ?? []) {
    if (!page?.slug || page.hasCustomPage) continue
    entries.push({ url: `${SITE_URL}/${page.slug}`, changeFrequency: 'monthly', priority: 0.5 })
  }

  return entries
}
