'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn, getDateTimeFormat } from '@/lib/utils'

export const WritingLink = ({ post }) => {
  const pathname = usePathname()
  const isActive = pathname === `/writing/${post.slug}`
  const date = getDateTimeFormat(post.date)

  return (
    <Link
      key={post.slug}
      href={`/writing/${post.slug}`}
      className={cn('flex flex-col gap-1 rounded-lg p-2', isActive ? 'bg-[#29292d] text-[#f0eff1]' : 'hover:bg-[#222225]')}
    >
      <span className="font-medium">{post.title}</span>
      <span className={cn(isActive ? 'text-[#c1c0c5]' : 'text-[#a1a0a5]')}>{date}</span>
    </Link>
  )
}
