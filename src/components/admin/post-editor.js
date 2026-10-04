'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, SaveIcon, Trash2Icon } from 'lucide-react'

import { Field, TextInput, TextArea } from '@/components/admin/field'
import { MarkdownEditor } from '@/components/admin/markdown-editor'
import { MediaUploader } from '@/components/admin/media-uploader'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { StatusToast } from '@/components/admin/status-toast'

const MAX_TITLE = 160
const MAX_DESCRIPTION = 320
const EMPTY = { title: '', description: '', body: '' }

export function PostEditor({ post, images, slug, actions }) {
  const router = useRouter()
  const isNew = !post?.id

  const [values, setValues] = useState({
    title: post?.title ?? '',
    description: post?.description ?? '',
    body: post?.body ?? ''
  })
  const [media, setMedia] = useState(images ?? [])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // Images are uploaded before the post exists, so a new post uploads into a
  // throwaway folder keyed by the slug. Existing posts upload into their own id.
  const uploadTarget = post?.id ?? slug ?? 'draft'

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  const handleSave = (event) => {
    event.preventDefault()
    setStatus('idle')

    startTransition(async () => {
      const result = await actions.save({
        id: post?.id,
        title: values.title,
        description: values.description,
        body: values.body,
        images: media.map((image, index) => ({
          url: image.url,
          alt: image.alt ?? '',
          is_cover: Boolean(image.is_cover),
          position: index
        }))
      })

      if (!result?.ok) {
        setStatus('error')
        setMessage(result?.error || 'The post could not be saved.')
        return
      }

      setStatus('success')
      setMessage(isNew ? 'Post published.' : 'Changes saved.')
      router.push('/admin')
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actions.remove(post.id)
      if (!result?.ok) {
        setStatus('error')
        setMessage(result?.error || 'The post could not be deleted.')
        return
      }
      router.push('/admin')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-[#a1a0a5] hover:text-[#f0a878]">
          <ChevronLeftIcon size={15} /> All posts
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <button type="button" onClick={() => setConfirmOpen(true)} className="button-secondary">
              <Trash2Icon size={15} /> Delete
            </button>
          )}
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? 'Saving…' : isNew ? 'Publish post' : 'Save changes'} <SaveIcon size={15} />
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-5">
        <Field label="Title" htmlFor="post-title" optional hint="Shown on /writing, the sidebar and the home page.">
          <TextInput
            id="post-title"
            value={values.title}
            onChange={update('title')}
            maxLength={MAX_TITLE}
            disabled={isPending}
            placeholder="What is this post about?"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="post-description"
          optional
          hint="A short summary. Used for link previews and search results."
        >
          <TextArea
            id="post-description"
            value={values.description}
            onChange={update('description')}
            maxLength={MAX_DESCRIPTION}
            rows={3}
            disabled={isPending}
            placeholder="One or two sentences."
          />
        </Field>
      </section>

      <section>
        <h2 className="mb-3">Body</h2>
        <MarkdownEditor
          value={values.body}
          onChange={(body) => setValues((current) => ({ ...current, body }))}
          disabled={isPending}
          placeholder={'Write in markdown.\n\n## A heading\n\nSome **bold** text and a [link](https://example.com).'}
        />
      </section>

      <section>
        <h2 className="mb-3">Images</h2>
        <p className="mb-3 text-sm text-[#a1a0a5]">
          Optional. The cover image is used on the /writing list, the sidebar and social previews.
        </p>
        <MediaUploader
          scope="posts"
          recordId={uploadTarget}
          images={media}
          onChange={setMedia}
          disabled={isPending}
        />
      </section>

      {!isNew && post?.like_count > 0 && (
        <p className="mb-0 rounded-xl border border-dashed border-[#3b3b40] bg-[#1b1b1e] px-5 py-4 text-sm text-[#a1a0a5]">
          {post.like_count} {post.like_count === 1 ? 'visitor has' : 'visitors have'} liked this post.
        </p>
      )}

      <StatusToast status={status} message={message} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${post?.title || 'Untitled'}”?`}
        description="The post and its images are removed from the site straight away. This cannot be undone."
        pending={isPending}
        onConfirm={handleDelete}
      />
    </form>
  )
}

export { EMPTY as EMPTY_POST }