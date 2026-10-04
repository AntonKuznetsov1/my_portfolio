import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0a878] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-[#47474c] bg-[#202023] text-[#dedde0] shadow-sm hover:bg-[#29292d] hover:text-white',
        destructive:
          'bg-red-500 text-gray-50 shadow-sm hover:bg-red-500/90 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/90',
        outline:
          'border border-[#3b3b40] bg-transparent text-[#d0cfd2] shadow-sm hover:bg-[#222225] hover:text-white',
        secondary:
          'bg-[#222225] text-[#dedde0] shadow-sm hover:bg-[#29292d]',
        ghost: 'text-[#d0cfd2] hover:bg-[#222225] hover:text-white',
        link: 'text-[#f0a878] underline-offset-4 hover:text-[#ffc69e] hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-md px-0.5 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
