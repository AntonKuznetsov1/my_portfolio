'use client'

import { useState } from 'react'
import { FolderKanbanIcon, PencilLineIcon } from 'lucide-react'

import { RecordList, Tabs, NewRecordButton } from '@/components/admin/record-list'
import { deletePost, deleteProject } from '@/app/admin/actions'

const TABS = [
  { id: 'posts', label: 'Posts', Icon: PencilLineIcon },
  { id: 'projects', label: 'Projects', Icon: FolderKanbanIcon }
]

export function AdminDashboard({ posts, projects }) {
  const [tab, setTab] = useState('posts')

  const isPosts = tab === 'posts'
  const items = isPosts ? posts : projects

  const handleDelete = (item) => (isPosts ? deletePost(item.id) : deleteProject(item.id))

  return (
    <div className="content-wrapper">
      <div className="content">
        <div className="mb-8">
          <p className="eyebrow mb-2">Dashboard</p>
          <h1 className="mb-0 text-4xl font-light leading-tight">Content</h1>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
          <NewRecordButton href={isPosts ? '/admin/posts/new' : '/admin/projects/new'}>
            New {isPosts ? 'post' : 'project'}
          </NewRecordButton>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="mb-0">
            {isPosts ? 'Blog posts' : 'Projects'}
          </h2>
          <span className="text-sm text-[#88878d]">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <RecordList
          key={tab}
          items={items}
          type={isPosts ? 'posts' : 'projects'}
          hrefFor={(item) => (isPosts ? `/admin/posts/${item.id}` : `/admin/projects/${item.id}`)}
          viewHrefFor={(item) => (isPosts ? `/writing/${item.slug}` : `/projects/${item.slug}`)}
          onDelete={handleDelete}
          emptyTitle={isPosts ? 'No posts yet.' : 'No projects yet.'}
          emptyDescription={
            isPosts
              ? 'Write your first post. It appears on /writing and the home page as soon as you publish.'
              : 'Add your first client project to fill in the /projects page.'
          }
        />
      </div>
    </div>
  )
}