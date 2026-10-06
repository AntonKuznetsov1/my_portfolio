import { createClient } from '@supabase/supabase-js'

/**
 * Server-only client that bypasses Row Level Security. It must never be imported
 * from a client component, and its key must never be exposed as a NEXT_PUBLIC_
 * variable.
 *
 * The client is built on first use rather than at module scope. OpenNext applies
 * Worker runtime bindings to process.env inside its request-time init, which runs
 * after the server bundle has been evaluated, so anything read at module scope
 * sees an empty environment. A module-scope client was therefore permanently
 * null in production and every admin page failed with a 500.
 *
 * Cache the instance so repeated calls do not rebuild it, and let a failed
 * lookup be retried rather than remembered.
 */
let cached = null

export function getAdminSupabase() {
  if (cached) return cached

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  return cached
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
