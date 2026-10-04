import { PageTitle } from '@/components/page-title'
import { PostEditor } from '@/components/admin/post-editor'
import { savePost } from '@/app/admin/actions'

export const metadata = {
  title: 'New post'
}

export default function NewPostPage() {
  return (
    <div className="content-wrapper">
      <div className="content">
        <PageTitle title="New post" className="mb-6" />
        <PostEditor slug="draft" actions={{ save: savePost }} />
      </div>
    </div>
  )
}