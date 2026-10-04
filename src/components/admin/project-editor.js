'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, SaveIcon, Trash2Icon } from 'lucide-react'

import { Field, TextInput, TextArea } from '@/components/admin/field'
import { MediaUploader } from '@/components/admin/media-uploader'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { StatusToast } from '@/components/admin/status-toast'

const MAX_TITLE = 160
const MAX_DESCRIPTION = 600
const MAX_PRICE = 60

export function ProjectEditor({ project, images, slug, actions }) {
  const router = useRouter()
  const isNew = !project?.id

  const [values, setValues] = useState({
    title: project?.title ?? '',
    description: project?.description ?? '',
    project_url: project?.project_url ?? '',
    github_url: project?.github_url ?? '',
    price: project?.price ?? ''
  })
  const [media, setMedia] = useState(images ?? [])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const uploadTarget = project?.id ?? slug ?? 'draft'

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  const handleSave = (event) => {
    event.preventDefault()
    setStatus('idle')

    startTransition(async () => {
      const result = await actions.save({
        id: project?.id,
        title: values.title,
        description: values.description,
        project_url: values.project_url,
        github_url: values.github_url,
        price: values.price,
        images: media.map((image, index) => ({
          url: image.url,
          alt: image.alt ?? '',
          is_cover: Boolean(image.is_cover),
          position: index
        }))
      })

      if (!result?.ok) {
        setStatus('error')
        setMessage(result?.error || 'The project could not be saved.')
        return
      }

      setStatus('success')
      setMessage(isNew ? 'Project published.' : 'Changes saved.')
      router.push('/admin')
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actions.remove(project.id)
      if (!result?.ok) {
        setStatus('error')
        setMessage(result?.error || 'The project could not be deleted.')
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
          <ChevronLeftIcon size={15} /> All projects
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <button type="button" onClick={() => setConfirmOpen(true)} className="button-secondary">
              <Trash2Icon size={15} /> Delete
            </button>
          )}
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? 'Saving…' : isNew ? 'Publish project' : 'Save changes'} <SaveIcon size={15} />
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-5">
        <Field label="Title" htmlFor="project-title" optional hint="Shown on the projects page and its detail view.">
          <TextInput
            id="project-title"
            value={values.title}
            onChange={update('title')}
            maxLength={MAX_TITLE}
            disabled={isPending}
            placeholder="Client website, landing page, redesign…"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="project-description"
          optional
          hint="What the project was and what you contributed."
        >
          <TextArea
            id="project-description"
            value={values.description}
            onChange={update('description')}
            maxLength={MAX_DESCRIPTION}
            rows={5}
            disabled={isPending}
            placeholder="A short case study."
          />
        </Field>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="mb-0">Links</h2>

        <Field
          label="Project link"
          htmlFor="project-url"
          hint="Required. Where the finished work lives."
          error={values.project_url && !isValidUrl(values.project_url) ? 'Enter a full URL, for example https://example.com' : ''}
        >
          <TextInput
            id="project-url"
            type="url"
            inputMode="url"
            value={values.project_url}
            onChange={update('project_url')}
            disabled={isPending}
            required
            placeholder="https://example.com"
          />
        </Field>

        <Field label="GitHub repository" htmlFor="project-github" optional hint="Leave empty if the code is private.">
          <TextInput
            id="project-github"
            type="url"
            inputMode="url"
            value={values.github_url}
            onChange={update('github_url')}
            disabled={isPending}
            placeholder="https://github.com/you/project"
          />
        </Field>

        <Field
          label="Price"
          htmlFor="project-price"
          optional
          hint="Free text, exactly as it should appear — “From $1,200”, “€800”, “On request”."
        >
          <TextInput
            id="project-price"
            value={values.price}
            onChange={update('price')}
            maxLength={MAX_PRICE}
            disabled={isPending}
            placeholder="From $1,200"
          />
        </Field>
      </section>

      <section>
        <h2 className="mb-3">Images</h2>
        <p className="mb-3 text-sm text-[#a1a0a5]">
          Optional. The cover image is used on the projects grid. Add more to build the gallery on the detail page.
        </p>
        <MediaUploader scope="projects" recordId={uploadTarget} images={media} onChange={setMedia} disabled={isPending} />
      </section>

      <StatusToast status={status} message={message} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${project?.title || 'Untitled'}”?`}
        description="The project and its images are removed from the site straight away. This cannot be undone."
        pending={isPending}
        onConfirm={handleDelete}
      />
    </form>
  )
}

function isValidUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}