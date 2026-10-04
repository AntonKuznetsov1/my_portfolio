'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { ImagePlusIcon, StarIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

const MAX_ALT_LENGTH = 160

/**
 * Drag-and-drop image manager shared by posts and projects.
 *
 * Files go straight to Supabase Storage through /api/admin/upload, then the
 * parent saves the returned URLs with the rest of the record. Until the form is
 * saved they only live in React state, so nothing is orphaned in the database.
 */
export const MediaUploader = ({ scope, recordId, images = [], onChange, disabled = false, max = 20 }) => {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(timer)
  }, [error])

  const upload = useCallback(
    async (files) => {
      const picked = Array.from(files ?? [])
      if (!picked.length) return

      // A local accumulator so a slow upload never reads a stale images prop.
      const next = [...images]
      const room = max - next.length
      if (room <= 0) {
        setError(`You can attach up to ${max} images.`)
        return
      }

      const accepted = picked.slice(0, room)
      if (accepted.length < picked.length) {
        setError(`Only the first ${room} image${room === 1 ? '' : 's'} fitted — the limit is ${max}.`)
      } else {
        setError('')
      }

      for (const file of accepted) {
        const id = crypto.randomUUID()
        setPending((current) => [...current, { id, name: file.name, status: 'uploading' }])

        try {
          const body = new FormData()
          body.set('file', file)
          body.set('scope', scope)
          body.set('recordId', recordId)

          const response = await fetch('/api/admin/upload', { method: 'POST', body })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'The image could not be uploaded.')

          next.push({
            url: result.url,
            path: result.path,
            alt: '',
            is_cover: next.length === 0,
            position: next.length
          })
          onChange(next.map((image, index) => ({ ...image, position: index })))

          setPending((current) => current.filter((entry) => entry.id !== id))
        } catch (uploadError) {
          setError(uploadError.message)
          setPending((current) => current.filter((entry) => entry.id !== id))
        }
      }
    },
    [images, max, onChange, recordId, scope]
  )

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    upload(event.dataTransfer.files)
  }

  const update = (index, patch) => {
    onChange(images.map((image, imageIndex) => (imageIndex === index ? { ...image, ...patch } : image)))
  }

  const remove = (index) => {
    const target = images[index]
    if (target?.path) {
      fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: target.path })
      }).catch(() => {})
    }
    onChange(images.filter((_, imageIndex) => imageIndex !== index))
  }

  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((image, imageIndex) => ({ ...image, position: imageIndex })))
  }

  const setCover = (index) => {
    onChange(images.map((image, imageIndex) => ({ ...image, is_cover: imageIndex === index })))
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-5 py-8 text-center transition-colors',
          dragging ? 'border-[#f0a878] bg-[#1f1a16]' : 'border-[#3b3b40] bg-[#1b1b1e]',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <ImagePlusIcon size={20} className={dragging ? 'text-[#f0a878]' : 'text-[#88878d]'} />
        <p className="mb-0 font-sans text-sm font-medium text-[#f4f3f5]">
          {dragging ? 'Drop to upload' : 'Drag images here'}
        </p>
        <p className="mb-0 text-xs text-[#88878d]">
          or click to browse · JPEG, PNG, WebP, AVIF or GIF · up to 5 MB · {images.length}/{max} attached
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          disabled={disabled || images.length >= max}
          onChange={(event) => {
            upload(event.target.files)
            event.target.value = ''
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>

      {error && <p className="mb-0 text-xs text-red-400">{error}</p>}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {pending.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 text-xs text-[#88878d]">
              <Loader2Icon size={13} className="shrink-0 animate-spin text-[#f0a878]" />
              <span className="truncate">Uploading {entry.name}…</span>
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.url}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border bg-[#1b1b1e] transition-colors',
                image.is_cover ? 'border-[#f0a878]' : 'border-[#343438]'
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#121214]">
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  width={400}
                  height={300}
                  loading="lazy"
                  className="size-full animate-reveal border-0 object-cover"
                />
                {image.is_cover && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-[#9b6f53] bg-[#2a2119]/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#f0a878]">
                    <StarIcon size={10} /> Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-2 top-2 rounded-md border border-[#343438] bg-[#171719]/90 p-1.5 text-[#a1a0a5] opacity-0 transition-colors hover:border-[#6b3f3f] hover:text-[#f0a0a0] focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2Icon size={13} />
                </button>
              </div>
              <div className="flex flex-col gap-2 p-2">
                <input
                  type="text"
                  value={image.alt ?? ''}
                  onChange={(event) => update(index, { alt: event.target.value.slice(0, MAX_ALT_LENGTH) })}
                  disabled={disabled}
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${index + 1}`}
                  className="w-full rounded-md border border-[#343438] bg-[#121214] px-2 py-1 text-xs text-[#f0eff1] outline-none transition placeholder:text-[#6a696f] focus:border-[#f0a878]"
                />
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={disabled || index === 0}
                      aria-label="Move image earlier"
                      className="rounded-md border border-[#343438] p-1 text-[#a1a0a5] transition-colors hover:bg-[#222225] hover:text-[#f0eff1] disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ArrowUpIcon size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={disabled || index === images.length - 1}
                      aria-label="Move image later"
                      className="rounded-md border border-[#343438] p-1 text-[#a1a0a5] transition-colors hover:bg-[#222225] hover:text-[#f0eff1] disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ArrowDownIcon size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCover(index)}
                    disabled={disabled || image.is_cover}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-colors hover:bg-[#222225] disabled:cursor-default"
                  >
                    <StarIcon size={11} className={image.is_cover ? 'text-[#f0a878]' : 'text-[#6a696f]'} />
                    <span className={image.is_cover ? 'text-[#f0a878]' : 'text-[#88878d]'}>Cover</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
