'use client'

import { useState } from 'react'
import { ColumnsIcon, EyeIcon, PenLineIcon } from 'lucide-react'

import { Markdown } from '@/components/markdown'
import { cn } from '@/lib/utils'

const MODES = [
  { id: 'write', label: 'Write', Icon: PenLineIcon },
  { id: 'split', label: 'Split', Icon: ColumnsIcon },
  { id: 'preview', label: 'Preview', Icon: EyeIcon }
]

/**
 * Markdown textarea with a live preview rendered by the same Markdown component
 * the published page uses, so what you see here is what visitors get.
 */
export const MarkdownEditor = ({ value, onChange, placeholder, rows = 18, disabled = false }) => {
  const [mode, setMode] = useState('write')
  const showEditor = mode !== 'preview'
  const showPreview = mode !== 'write'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[#343438] bg-[#1b1b1e] p-0.5">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              disabled={disabled}
              aria-pressed={mode === id}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                mode === id ? 'bg-[#29292d] text-[#f0a878]' : 'text-[#a1a0a5] hover:text-[#f0eff1]',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#88878d]">{value?.length ? `${value.length} characters` : 'Empty'}</span>
      </div>

      <div
        className={cn(
          'grid gap-3',
          mode === 'split' && 'md:grid-cols-2 md:divide-x md:divide-[#343438] md:gap-0'
        )}
      >
        {showEditor && (
          <textarea
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={cn(
              'w-full resize-y rounded-lg border border-[#3b3b40] bg-[#1b1b1e] px-3 py-2.5 font-mono text-sm font-normal leading-relaxed text-[#f0eff1] outline-none transition placeholder:text-[#88878d] focus:border-[#f0a878] focus:ring-2 focus:ring-[#f0a878]/20',
              mode === 'split' && 'md:rounded-r-none'
            )}
          />
        )}
        {showPreview && (
          <div
            className={cn(
              'min-h-[12rem] overflow-x-auto rounded-lg border border-[#343438] bg-[#171719] px-3 py-2.5',
              mode === 'split' && 'md:rounded-l-none md:border-l-0'
            )}
          >
            {value?.trim() ? (
              <Markdown>{value}</Markdown>
            ) : (
              <p className="mb-0 text-sm text-[#88878d]">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}