import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-only client that bypasses Row Level Security. It must never be imported
 * from a client component, and its key must never be exposed as a NEXT_PUBLIC_
 * variable. Returns null when Supabase is not configured so every caller can
 * degrade gracefully, the way src/lib/contentful.js already does.
 */
export const adminSupabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey)
}