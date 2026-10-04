import { PageTitle } from '@/components/page-title'
import { ProjectEditor } from '@/components/admin/project-editor'
import { saveProject } from '@/app/admin/actions'

export const metadata = {
  title: 'New project'
}

export default function NewProjectPage() {
  return (
    <div className="content-wrapper">
      <div className="content">
        <PageTitle title="New project" className="mb-6" />
        <ProjectEditor slug="draft" actions={{ save: saveProject }} />
      </div>
    </div>
  )
}