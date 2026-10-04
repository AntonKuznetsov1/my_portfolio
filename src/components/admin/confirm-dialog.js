'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon, AlertTriangleIcon } from 'lucide-react'

/**
 * Confirmation dialog built on the same Radix primitive the mobile drawer uses,
 * so it adds no weight to the bundle. Styled to match the site: #1b1b1e surface,
// #343438 border, #f0a878 accent.
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  pending = false
}) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#343438] bg-[#1b1b1e] p-5 shadow-xl focus:outline-none">
        <div className="mb-2 flex items-start gap-2">
          <AlertTriangleIcon size={17} className="mt-0.5 shrink-0 text-[#f0a878]" />
          <DialogPrimitive.Title className="font-sans text-lg font-medium text-[#f4f3f5]">
            {title}
          </DialogPrimitive.Title>
        </div>
        <DialogPrimitive.Description className="mb-5 text-sm text-[#a1a0a5]">
          {description}
        </DialogPrimitive.Description>
        <div className="flex flex-wrap justify-end gap-3">
          <DialogPrimitive.Close asChild>
            <button type="button" className="button-secondary">
              Cancel
            </button>
          </DialogPrimitive.Close>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#6b3f3f] bg-[#2a1a1a] px-4 py-2.5 text-sm font-normal text-[#f0a0a0] transition duration-200 hover:-translate-y-0.5 hover:bg-[#351f1f] focus-visible:ring-2 focus-visible:ring-[#f0a878]"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
        <DialogPrimitive.Close asChild>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-[#88878d] transition-colors hover:bg-[#222225] hover:text-[#f4f3f5]"
          >
            <XIcon size={16} />
          </button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)