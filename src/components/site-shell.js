'use client'

import { usePathname } from 'next/navigation'

import { SideMenu } from '@/components/side-menu'
import { MenuContent } from '@/components/menu-content'

/**
 * The public site is wrapped in a left rail and a mobile drawer. The admin area
 * needs the whole viewport, so it renders on its own.
 *
 * This is a client component on purpose. Reading the session cookie in the root
 * layout would opt every public route into dynamic rendering and undo the static
 * prerendering of /, /projects and /skills. usePathname costs nothing.
 */
export function SiteShell({ children }) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return <div className="flex min-h-dynamic-screen flex-1 flex-col">{children}</div>
  }

  return (
    <div className="lg:flex">
      <SideMenu className="relative hidden lg:flex">
        <MenuContent />
      </SideMenu>
      <div className="flex flex-1">{children}</div>
    </div>
  )
}