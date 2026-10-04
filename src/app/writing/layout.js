import { Suspense } from 'react'

import { SideMenu } from '@/components/side-menu'
import { LoadingSpinner } from '@/components/loading-spinner'
import { WritingLink } from '@/components/writing-link'
import { getAllPosts } from '@/lib/posts'

export default async function WritingLayout({ children }) {
  const allPosts = await getAllPosts()

  return (
    <>
      <SideMenu title="Writing" isInner>
        <Suspense fallback={<LoadingSpinner />}>
          <div className="flex flex-col gap-1 text-sm">
            {allPosts.map((post) => (
              <WritingLink key={post.id ?? post.slug} post={post} />
            ))}
          </div>
        </Suspense>
      </SideMenu>
      <div className="lg:bg-dots flex-1">{children}</div>
    </>
  )
}