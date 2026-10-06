import Link from 'next/link'

import { NavigationLink } from '@/components/navigation-link'
import { PROFILES, LINKS } from '@/lib/constants'

export const MenuContent = () => {
  return (
    <div className="flex w-full flex-col font-headers text-sm">
      <div className="flex flex-col gap-4">
        <Link href="/" className="link-card inline-flex items-center gap-2 p-2">
<span
              aria-label="Anton Kuznetsov"
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#39393e] bg-[#222225] shadow-sm"
            >
              <img
                src="/assets/logo.png"
                alt="Akcadag logo"
                width={40}
                height={40}
                className="size-full object-cover p-0"
              />
            </span>
          <div className="flex flex-col">
            <span className="font-medium text-[#f0eff1]">Anton Kuznetsov</span>
            <span className="text-xs text-[#a1a0a5]">Web Developer &amp; Designer</span>
          </div>
        </Link>
        <div className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <NavigationLink key={link.href} href={link.href} label={link.label} icon={link.icon} />
          ))}
        </div>
      </div>
      <hr />
      <div className="flex flex-col gap-2 text-sm">
        <span className="px-2 text-[11px] font-normal uppercase tracking-[0.16em] text-[#88878d]">Online</span>
        <div className="flex flex-col gap-1">
          {Object.values(PROFILES).map((profile) => (
            <NavigationLink key={profile.url} href={profile.url} label={profile.title} icon={profile.icon} />
          ))}
        </div>
      </div>
    </div>
  )
}
