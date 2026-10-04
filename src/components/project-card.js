import Link from 'next/link'
import { ArrowUpRightIcon, BanknoteIcon, ImageIcon } from 'lucide-react'

import { SafeImage } from '@/components/safe-image'
import { getDateTimeFormat, getHostname } from '@/lib/utils'

/**
 * Project tile. Uses the same recipe as BookmarkCard — thumbnail-shadow, the
 * #1b1b1e surface, the #222225 hover — so the projects grid sits comfortably
 * next to the bookmark collections.
 */
export const ProjectCard = ({ project }) => {
  const { slug, title, price, project_url, published_at, cover } = project
  const hostname = getHostname(project_url)

  return (
    <Link
      href={`/projects/${slug}`}
      className="thumbnail-shadow flex aspect-auto min-w-0 cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border border-[#343438] bg-[#1b1b1e] p-4 transition-colors duration-300 hover:bg-[#222225]"
    >
      <span className="aspect-[1200/630] overflow-hidden rounded-lg">
        {cover ? (
          <SafeImage
            src={cover.url}
            alt={cover.alt || title || ''}
            width={1200}
            height={630}
            loading="lazy"
            className="aspect-[1200/630] animate-reveal rounded-lg border bg-[url('/assets/fallback.webp')] bg-cover bg-center bg-no-repeat object-cover"
          />
        ) : (
          <span className="flex aspect-[1200/630] animate-reveal items-center justify-center rounded-lg border border-[#343438] bg-[#121214] text-[#55545a]">
            <ImageIcon size={28} />
          </span>
        )}
      </span>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="mb-0">{title || hostname || 'Untitled project'}</h3>
          <ArrowUpRightIcon size={16} className="mt-1 shrink-0 text-[#88878d]" />
        </div>

        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
          <time dateTime={published_at}>{getDateTimeFormat(published_at)}</time>
          {hostname && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{hostname}</span>
            </>
          )}
        </span>

        {price && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#9b6f53] bg-[#2a2119] px-2.5 py-1 text-xs font-medium text-[#f0a878]">
            <BanknoteIcon size={12} />
            {price}
          </span>
        )}
      </div>
    </Link>
  )
}
