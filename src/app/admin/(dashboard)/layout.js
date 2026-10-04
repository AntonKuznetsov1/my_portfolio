import { redirect } from 'next/navigation'

import { AdminHeader } from '@/components/admin/admin-header'
import { getSession } from '@/lib/admin-auth'
import { logout } from '@/app/admin/actions'

/**
 * Session guard for every admin screen except /admin/login. proxy.js already
 * redirects anonymous page visits; this is the belt to its braces, because a
 * Server Function can be invoked directly by POST.
 */
export default async function DashboardLayout({ children }) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="flex min-h-dynamic-screen flex-col">
      <AdminHeader onSignOut={logout} />
      {children}
    </div>
  )
}