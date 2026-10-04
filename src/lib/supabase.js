import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false
        }
      })
    : null
export const tableName = 'pages'

export async function getViewCounts() {
  if (!supabase) return []

  const { data, error } = await supabase.from(tableName).select('id, slug, view_count')
  if (error || !data) return []

  return data.map(({ id, slug, view_count }) => ({
    id,
    slug,
    view_count
  }))
}

export async function upsertViewCount(slug) {
  if (!supabase || !slug) return { view_count: 0 }

  // Don't bump the counter in development
  if (process.env.NODE_ENV !== 'production') {
    const { data } = await supabase.from(tableName).select('view_count').eq('slug', slug).limit(1)
    return { view_count: data?.[0]?.view_count ?? 0 }
  }

  // The increment happens in the database. Doing it in the browser meant reading
  // the row, adding one and upserting, which raced with other visitors and could
  // not be granted without also handing anon a way to set the number directly.
  const { data, error } = await supabase.rpc('bump_page_view', { p_slug: slug })

  return { view_count: error ? 0 : data ?? 0 }
}
