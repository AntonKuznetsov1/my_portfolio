import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { getAdminOverview } from '@/app/admin/actions'

export default async function AdminPage() {
  const { posts, projects } = await getAdminOverview()

  return <AdminDashboard posts={posts} projects={projects} />
}