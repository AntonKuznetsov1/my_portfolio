import { notFound } from 'next/navigation'

import { PageTitle } from '@/components/page-title'
import { PostEditor } from '@/components/admin/post-editor'
import { deletePost, getPostForAdmin, savePost } from '@/app/admin/actions'

export const metadata = {
  title: 'Edit post'
}

export default async function EditPostPage({ params }) {
  const { id } = await params
  const record = await getPostForAdmin(id)

  if (!record?.post) notFound()

  return (
    <div className="content-wrapper">
      <div className="content">
        <PageTitle title="Edit post" className="mb-6" />
        <PostEditor post={record.post} images={record.images} actions={{ save: savePost, remove: deletePost }} />
      </div>
    </div>
  )
}