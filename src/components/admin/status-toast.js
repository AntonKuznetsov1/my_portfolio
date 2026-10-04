'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const VARIANTS = {
  success: { Icon: CheckCircle2Icon, className: 'border-[#3f6b4f] bg-[#16241b] text-[#8fd6a4]' },
  error: { Icon: AlertCircleIcon, className: 'border-[#6b3f3f] bg-[#241616] text-[#f0a0a0]' },
  info: { Icon: InfoIcon, className: 'border-[#3b3b40] bg-[#1b1b1e] text-[#c1c0c5]' }
}

/**
 * Status line for form feedback. Uses the same short opacity/translate
 * transitions as the code block copy button, so it reads as part of the site
 * rather than as a bolted-on notification.
 */
export const StatusToast = ({ status = 'idle', message, className }) => {
  if (status === 'idle' || !message) return null

  const { Icon, className: variantClassName } = VARIANTS[status] ?? VARIANTS.info

  return (
    <div className={cn('pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${status}-${message}`}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'pointer-events-auto flex max-w-md items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg backdrop-blur',
            variantClassName
          )}
        >
          <Icon size={16} className="shrink-0" />
          <span>{message}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}