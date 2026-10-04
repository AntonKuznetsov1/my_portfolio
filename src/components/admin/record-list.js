'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PencilIcon, Trash2Icon, PlusIcon, ExternalLinkIcon } from 'lucide-react'

import { Chip } from '@/components/admin/field'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { cn, getDateTimeFormat } from '@/lib/utils'

/**
 * Shared list of saved records for the dashboard. Posts and projects differ only
 * in their metadata line, so one component covers both.
 */
export const RecordList = ({ items = [], type, emptyTitle, emptyDescription, hrefFor, onDelete, viewHrefFor }) => {
  const router = useRouter()
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isPending, startTransition] = useTransition()

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#3b3b40] bg-[#1b1b1e] px-5 py-6">
        <p className="mb-1 font-sans text-sm font-medium text-[#f4f3f5]">{emptyTitle}</p>
        <p className="mb-0 text-sm text-[#a1a0a5]">{emptyDescription}</p>
      </div>
    )
  }

  const confirmDelete = () => {
    startTransition(async () => {
      await onDelete(pendingDelete)
      setPendingDelete(null)
      router.refresh()
    })
  }

  return (
    <>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="border-t border-[#343438] last:border-b">
            <div className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-[#f4f3f5]">{item.title || 'Untitled'}</span>
                  {item.price && <Chip accent>{item.price}</Chip>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#88878d]">
                  <span className="truncate font-mono text-[#6a696f]">/{item.slug}</span>
                  <span aria-hidden>·</span>
                  <span>{getDateTimeFormat(item.published_at)}</span>
                  {typeof item.like_count === 'number' && (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        {item.like_count} {item.like_count === 1 ? 'like' : 'likes'}
                      </span>
                    </>
                  )}
                  {item.image_count > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        {item.image_count} {item.image_count === 1 ? 'image' : 'images'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {viewHrefFor && (
                  <Link
                    href={viewHrefFor(item)}
                    target="_blank"
                    title="View on the site"
                    className="rounded-lg p-2 text-[#a1a0a5] transition-colors hover:bg-[#222225] hover:text-[#f0a878]"
                  >
                    <ExternalLinkIcon size={15} />
                  </Link>
                )}
                <Link
                  href={hrefFor(item)}
                  title="Edit"
                  className="rounded-lg p-2 text-[#a1a0a5] transition-colors hover:bg-[#222225] hover:text-[#f0a878]"
                >
                  <PencilIcon size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(item)}
                  title="Delete"
                  className="rounded-lg p-2 text-[#a1a0a5] transition-colors hover:bg-[#222225] hover:text-[#f0a0a0]"
                >
                  <Trash2Icon size={15} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete “${pendingDelete?.title || 'Untitled'}”?`}
        description={
          type === 'posts'
            ? 'The post and its images are removed from the site straight away. This cannot be undone.'
            : 'The project and its images are removed from the site straight away. This cannot be undone.'
        }
        pending={isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

export const NewRecordButton = ({ href, children }) => (
  <Link href={href} className="button-primary">
    <PlusIcon size={15} />
    {children}
  </Link>
)

export const ListHeading = ({ icon: Icon, children, action }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 className="mb-0 flex items-center gap-2">
      <Icon size={20} className="text-[#f0a878]" /> {children}
    </h2>
    {action}
  </div>
)

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="inline-flex rounded-lg border border-[#343438] bg-[#1b1b1e] p-0.5">
    {tabs.map(({ id, label, Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        aria-pressed={active === id}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          active === id ? 'bg-[#29292d] text-[#f0a878]' : 'text-[#a1a0a5] hover:text-[#f0eff1]'
        )}
      >
        <Icon size={15} />
        {label}
      </button>
    ))}
  </div>
)