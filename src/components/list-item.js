'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export const ListItem = ({ title, description, path }) => {
  const pathname = usePathname()
  const isActive = pathname === path

  return (
    <Link
      key={path}
      href={path}
      className={cn('flex flex-col gap-1 rounded-lg p-2', isActive ? 'bg-[#29292d]' : 'hover:bg-[#222225]')}
    >
      <span className={cn('font-normal text-[#d0cfd2]', isActive && 'text-[#f0eff1]')}>{title}</span>
      {description && <span className={cn(isActive ? 'text-[#c1c0c5]' : 'text-[#a1a0a5]')}>{description}</span>}
    </Link>
  )
}
