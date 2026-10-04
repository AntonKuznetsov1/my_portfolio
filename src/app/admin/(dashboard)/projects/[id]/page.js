import { notFound } from 'next/navigation'

import { PageTitle } from '@/components/page-title'
import { ProjectEditor } from '@/components/admin/project-editor'
import { deleteProject, getProjectForAdmin, saveProject } from '@/app/admin/actions'

export const metadata = {
  title: 'Edit project'
}

export default async function EditProjectPage({ params }) {
  const { id } = await params
  const record = await getProjectForAdmin(id)

  if (!record?.project) notFound()

  return (
    <div className="content-wrapper">
      <div className="content">
        <PageTitle title="Edit project" className="mb-6" />
        <ProjectEditor project={record.project} images={record.images} actions={{ save: saveProject, remove: deleteProject }} />
      </div>
    </div>
  )
}