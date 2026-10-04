import { ScrollArea } from '@/components/scroll-area'
import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { ProjectList } from '@/components/project-list'
import { getAllProjects } from '@/lib/projects'

export const metadata = {
  title: 'Projects',
  description: 'Websites and client projects by Anton Kuznetsov.'
}

// Keeps the grid warm between deploys. Creating, editing or deleting a project
// in the admin area calls revalidatePath, so changes still appear immediately.
export const revalidate = 3600

export default async function Projects() {
  const projects = await getAllProjects()

  return (
    <ScrollArea className="flex flex-col" hasScrollTitle>
      <FloatingHeader scrollTitle="Projects" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Projects" subtitle={<p>Selected websites and client work.</p>} />
          <ProjectList projects={projects} />
        </div>
      </div>
    </ScrollArea>
  )
}