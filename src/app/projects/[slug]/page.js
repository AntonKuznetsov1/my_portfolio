import { notFound } from 'next/navigation'
import { ArrowUpRightIcon, BanknoteIcon, GithubIcon } from 'lucide-react'

import { ScrollArea } from '@/components/scroll-area'
import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { MediaGallery, MediaHero } from '@/components/media-gallery'
import { getProject, getAllProjectSlugs } from '@/lib/projects'
import { getDateTimeFormat, getHostname } from '@/lib/utils'

export const revalidate = 3600

export async function generateStaticParams() {
  const projects = await getAllProjectSlugs()
  return projects.map((project) => ({ slug: project.slug }))
}

export default async function ProjectPage({ params }) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) notFound()

  const { title, description, project_url, github_url, price, published_at, cover, images } = project
  const hostname = getHostname(project_url)
  const gallery = images.filter((image) => image.url !== cover?.url)
  const displayTitle = title || hostname || 'Project'

  return (
    <ScrollArea className="flex flex-col" hasScrollTitle>
      <FloatingHeader scrollTitle={displayTitle} goBackLink="/projects" />
      <div className="content-wrapper">
        <article className="content">
          <PageTitle
            title={displayTitle}
            subtitle={
              <div className="flex flex-col gap-3">
                {description && <p className="mb-0 text-[#a1a0a5]">{description}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-400">
                  <time dateTime={published_at}>{getDateTimeFormat(published_at)}</time>
                  {hostname && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{hostname}</span>
                    </>
                  )}
                </div>
              </div>
            }
            className="mb-6"
          />

          {price && (
            <p className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#9b6f53] bg-[#2a2119] px-3 py-1.5 text-sm font-medium text-[#f0a878]">
                <BanknoteIcon size={14} />
                {price}
              </span>
            </p>
          )}

          <MediaHero image={cover} className="mb-6" />

          <div className="mb-8 flex flex-wrap gap-3">
            <a href={project_url} target="_blank" rel="noopener noreferrer" className="button-primary">
              Visit live site <ArrowUpRightIcon size={15} />
            </a>
            {github_url && (
              <a href={github_url} target="_blank" rel="noopener noreferrer" className="button-secondary">
                <GithubIcon size={15} /> View repository
              </a>
            )}
          </div>

          {gallery.length > 0 && (
            <section className="mb-4">
              <h2 className="mb-4">Gallery</h2>
              <MediaGallery images={gallery} />
            </section>
          )}

          {gallery.length === 0 && !cover && (
            <p className="rounded-xl border border-dashed border-[#3b3b40] bg-[#1b1b1e] px-5 py-4 text-sm text-[#a1a0a5]">
              No images were attached to this project.
            </p>
          )}
        </article>
      </div>
    </ScrollArea>
  )
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return null

  const hostname = getHostname(project.project_url)
  const title = project.title || hostname || 'Project'
  const description = project.description || `A project by Anton Kuznetsov. ${hostname ?? ''}`.trim()
  const siteUrl = `/projects/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteUrl,
      ...(project.cover?.url && { images: [{ url: project.cover.url }] })
    },
    alternates: {
      canonical: siteUrl
    }
  }
}