import { Suspense } from 'react'
import { LockIcon } from 'lucide-react'

import { LoginForm } from '@/components/admin/login-form'
import { login } from '@/app/admin/actions'

export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false }
}

/** Unlisted entry point. Nothing on the public site links here. */
export default function AdminLoginPage() {
  return (
    <div className="flex h-dynamic-screen flex-col items-center overflow-y-auto bg-[#171719] px-6 py-20">
      <div className="my-auto w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#39393e] bg-[#222225] shadow-sm">
              <img
                src="/assets/logo.png"
                alt="Akcadag logo"
                width={40}
                height={40}
                className="size-full object-cover"
              />
            </span>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-medium text-[#f0eff1]">Anton Kuznetsov</span>
            <span className="text-xs text-[#a1a0a5]">Web Developer &amp; Designer</span>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <h1 className="mb-0 flex items-center gap-2 text-4xl font-light leading-tight">
            <LockIcon size={24} className="text-[#f0a878]" />
            Sign in
          </h1>
        </div>

        <Suspense fallback={null}>
          <LoginForm login={login} />
        </Suspense>
      </div>
    </div>
  )
}
