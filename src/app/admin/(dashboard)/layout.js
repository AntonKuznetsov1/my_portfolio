import { redirect } from 'next/navigation'

import { AdminHeader } from '@/components/admin/admin-header'
import { getSession } from '@/lib/admin-auth'
import { logout } from '@/app/admin/actions'

/**
 * Session guard for every admin screen except /admin/login. proxy.js already
 * redirects anonymous page visits; this is the belt to its braces, because a
 * Server Function can be invoked directly by POST.
 *
 * The fixed height plus the scrolling region below the header are required.
 * globals.css locks scrolling on `html`, because the public pages scroll inside
 * their own ScrollArea. Admin has no ScrollArea, so without a scrollport of its
 * own a long form simply grows past the viewport and cannot be reached. The
 * height has to be definite rather than a minimum: with `min-height` alone the
 * flex container grows with its content, so the child below would have nothing
 * to overflow. `min-h-0` lets that child shrink, since a flex item defaults to
 * `min-height: auto`.
 */
export default async function DashboardLayout({ children }) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="flex h-dynamic-screen flex-col">
      <AdminHeader onSignOut={logout} />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
