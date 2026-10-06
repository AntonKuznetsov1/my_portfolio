import { isAdminEnabled } from '@/lib/admin-auth'
import { isSupabaseConfigured } from '@/lib/admin-supabase'

/**
 * Every admin route renders per request. Server-only env values are empty at
 * build time (they are Worker bindings, not baked into the bundle), so
 * `isAdminEnabled()` was false while prerendering and `getSession()` returned
 * before ever touching `cookies()`. Next therefore classified /admin as static,
 * then threw "Page changed from static to dynamic at runtime, reason: cookies"
 * on the first real request. Forcing dynamic keeps the classification stable
 * and lets the layout read the bindings that actually exist.
 */
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true }
}

/**
 * The outer admin shell. It deliberately holds no session check, because
 * /admin/login lives underneath it and must render for signed-out visitors.
 * The guard lives in the (dashboard) route group instead.
 */
export default function AdminLayout({ children }) {
  if (!isAdminEnabled() || !isSupabaseConfigured()) {
    return (
      <div className="flex h-dynamic-screen flex-col items-center gap-4 overflow-y-auto bg-[#171719] px-6 py-20">
        <div className="mx-auto my-auto w-full max-w-lg rounded-xl border border-dashed border-[#3b3b40] bg-[#1b1b1e] px-5 py-6 text-sm text-[#a1a0a5]">
          <p className="mb-2 font-sans text-sm font-medium text-[#f4f3f5]">The admin area is not configured.</p>
          <p className="mb-0">
            Set <code className="inline-code">ADMIN_PASSWORD</code> and{' '}
            <code className="inline-code">ADMIN_SESSION_SECRET</code>, add{' '}
            <code className="inline-code">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="inline-code">SUPABASE_SERVICE_ROLE_KEY</code>, then run{' '}
            <code className="inline-code">supabase/portfolio.sql</code> in the Supabase SQL editor.
          </p>
        </div>
      </div>
    )
  }

  return <div className="min-h-dynamic-screen bg-[#171719]">{children}</div>
}
