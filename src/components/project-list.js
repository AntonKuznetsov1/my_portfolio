'use client'

import { useMemo, useState } from 'react'
import { FolderKanbanIcon, SearchIcon } from 'lucide-react'

import { ProjectCard } from '@/components/project-card'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'with-price', label: 'Priced' }
]

export function ProjectList({ projects }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()

    return projects.filter((project) => {
      if (filter === 'with-price' && !project.price) return false
      if (!search) return true

      return [project.title, project.description, project.price, project.slug].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(search)
      )
    })
  }, [filter, projects, query])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[#343438] bg-[#1b1b1e] p-0.5">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={
                filter === id
                  ? 'rounded-md bg-[#29292d] px-3 py-1.5 text-xs font-medium text-[#f0a878]'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-[#a1a0a5] transition-colors hover:text-[#f0eff1]'
              }
            >
              {label}
            </button>
          ))}
        </div>

        <label className="relative flex items-center">
          <SearchIcon size={14} className="pointer-events-none absolute left-3 text-[#88878d]" />
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="w-48 rounded-lg border border-[#3b3b40] bg-[#1b1b1e] py-2 pl-8 pr-3 text-sm text-[#f0eff1] outline-none transition placeholder:text-[#88878d] focus:border-[#f0a878] focus:ring-2 focus:ring-[#f0a878]/20"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#3b3b40] bg-[#1b1b1e] px-5 py-6">
          <div className="mb-2 flex items-center gap-2 font-sans text-sm font-medium text-[#f4f3f5]">
            <FolderKanbanIcon size={17} className="text-[#f0a878]" />
            {projects.length === 0 ? 'No projects published yet.' : 'Nothing matches that search.'}
          </div>
          <p className="mb-0 text-sm text-[#a1a0a5]">
            {projects.length === 0
              ? 'Client work added in the admin area shows up here.'
              : 'Try a different term, or clear the filters to see everything.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}