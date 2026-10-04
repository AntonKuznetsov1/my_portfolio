import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

// The one place the form control styling lives. Every input, textarea and select
// in the admin area reuses this so the whole area matches the contact form.
export const controlClassName =
  'w-full rounded-lg border border-[#3b3b40] bg-[#1b1b1e] px-3 py-2.5 font-sans font-normal text-[#f0eff1] outline-none transition placeholder:text-[#88878d] focus:border-[#f0a878] focus:ring-2 focus:ring-[#f0a878]/20'

export const Field = ({ label, htmlFor, hint, optional = false, error, children, className }) => (
  <label
    htmlFor={htmlFor}
    className={cn('flex flex-col gap-2 font-headers text-sm font-semibold text-[#e8ebf1]', className)}
  >
    <span className="flex items-baseline gap-2">
      {label}
      {optional && (
        <span className="text-[11px] font-normal uppercase tracking-[0.16em] text-[#88878d]">optional</span>
      )}
    </span>
    {children}
    {error ? (
      <span className="text-xs font-normal text-red-400">{error}</span>
    ) : (
      hint && <span className="text-xs font-normal text-[#88878d]">{hint}</span>
    )}
  </label>
)

export const TextInput = forwardRef(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(controlClassName, className)} {...rest} />
))
TextInput.displayName = 'TextInput'

export const TextArea = forwardRef(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn(controlClassName, 'resize-y', className)} {...rest} />
))
TextArea.displayName = 'TextArea'

export const Select = forwardRef(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(controlClassName, 'cursor-pointer appearance-none bg-[#1b1b1e] pr-8', className)}
    {...rest}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

/** A rounded pill used for counts, categories and statuses. */
export const Chip = ({ className, accent = false, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium',
      accent ? 'border-[#9b6f53] bg-[#2a2119] text-[#f0a878]' : 'border-[#3b3b40] bg-[#1b1b1e] text-[#a1a0a5]',
      className
    )}
    {...rest}
  />
)