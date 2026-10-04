import Link from 'next/link'

import { ScrollArea } from '@/components/scroll-area'
import { FloatingHeader } from '@/components/floating-header'
import { WritingList } from '@/components/writing-list'
import { getAllPosts } from '@/lib/posts'
import { getViewCounts } from '@/lib/supabase'
import { getDateTimeFormat } from '@/lib/utils'

export const revalidate = 3600

export default async function Writing() {
  const [allPosts, viewCounts] = await Promise.all([getAllPosts(), getViewCounts()])

  return (
    <>
      {/* Mobile: a plain list, because the writing sidebar is hidden below lg. */}
      <ScrollArea className="flex flex-col lg:hidden">
        <FloatingHeader title="Writing" />
        <div>
          {allPosts.map((post) => (
            <Link
              key={post.id ?? post.slug}
              href={`/writing/${post.slug}`}
              className="flex flex-col gap-1 border-b border-[#343438] px-4 py-3 text-sm hover:bg-[#222225]"
            >
              <span className="font-medium">{post.title}</span>
              <span className="text-slate-400">{getDateTimeFormat(post.date)}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>

      {/* Desktop: the year-grouped table, matching the home page. */}
      <ScrollArea className="hidden flex-col lg:flex" hasScrollTitle>
        <FloatingHeader scrollTitle="Writing" />
        <div className="content-wrapper">
          <div className="content">
            <WritingList items={allPosts} viewCounts={viewCounts} />
          </div>
        </div>
      </ScrollArea>
    </>
  )
}