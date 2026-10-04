'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLinkIcon, LogOutIcon } from 'lucide-react'

export const AdminHeader = ({ onSignOut }) => {
  const router = useRouter()

  const handleSignOut = async () => {
    await onSignOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="sticky inset-x-0 top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#343438] bg-[#171719]/95 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-label="Anton Kuznetsov"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#39393e] bg-[#222225] font-medium text-[#f0a878] shadow-sm"
        >
          AK
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-sans text-sm font-medium text-[#f0eff1]">Admin</span>
          <span className="truncate text-xs text-[#88878d]">Posts and projects</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#3b3b40] px-3 py-2 text-xs font-medium text-[#a1a0a5] transition-colors hover:border-[#6a696f] hover:bg-[#202023] hover:text-[#f0a878]"
        >
          View site <ExternalLinkIcon size={13} />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#3b3b40] px-3 py-2 text-xs font-medium text-[#a1a0a5] transition-colors hover:border-[#6a696f] hover:bg-[#202023] hover:text-[#f0a878]"
        >
          <LogOutIcon size={13} />
          <span className="hidden xs:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}