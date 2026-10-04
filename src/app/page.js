import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, BriefcaseIcon } from 'lucide-react'

import { ScrollArea } from '@/components/scroll-area'
import { LoadingSpinner } from '@/components/loading-spinner'
import { WritingList } from '@/components/writing-list'
import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { getAllPosts } from '@/lib/posts'
import { getViewCounts } from '@/lib/supabase'

export const revalidate = 3600

async function fetchData() {
  const [allPosts, viewCounts] = await Promise.all([getAllPosts(), getViewCounts()])
  return { allPosts, viewCounts }
}

export default async function Home() {
  const { allPosts, viewCounts } = await fetchData()

  return (
    <ScrollArea className="flex flex-col" hasScrollTitle>
      <FloatingHeader scrollTitle="Anton Kuznetsov" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Hi, I’m Anton." className="lg:hidden" />
          <div className="mb-10">
            <p className="eyebrow mb-3">Web developer · designer · cybersecurity student · Fredericton, NB</p>
            <h1 className="mb-5 hidden lg:block">Hi, I’m Anton.</h1>
            <p className="mb-4">
              I’m Anton Kuznetsov, a student at Fredericton High School pursuing a career in web development and
              cybersecurity.
            </p>
            <p>
              I build and design websites, work across the full stack, and have experience delivering client projects and
              launching websites for companies.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/projects" className="button-primary">
                Explore my projects <BriefcaseIcon size={16} />
              </Link>
              <Link href="/contact" className="button-secondary">
                Reach out to me <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
          <Suspense fallback={<LoadingSpinner />}>
            <h2 className="mb-4 mt-8">My latest article</h2>
            <WritingList items={allPosts} viewCounts={viewCounts} />
          </Suspense>
        </div>
      </div>
    </ScrollArea>
  )
}
