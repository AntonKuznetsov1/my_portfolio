import '@/globals.css'
import { draftMode } from 'next/headers'
import Script from 'next/script'
import { EyeIcon } from 'lucide-react'

import { SiteShell } from '@/components/site-shell'
import { sharedTitle, sharedDescription } from '@/app/shared-metadata'
import { SITE_URL } from '@/lib/site-url'

export default async function RootLayout({ children }) {
  const { isEnabled } = await draftMode()

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <main vaul-drawer-wrapper="" className="min-h-screen bg-[#171719]">
          {isEnabled && (
            <div className="absolute bottom-0 left-0 right-0 z-50 flex h-12 w-full items-center justify-center bg-green-500 text-center text-sm font-medium text-white">
              <div className="flex items-center gap-2">
                <EyeIcon size={16} />
                <span>Draft mode is enabled</span>
              </div>
            </div>
          )}
          <SiteShell>{children}</SiteShell>
        </main>
        {process.env.NEXT_PUBLIC_TINYBIRD_TOKEN && (
          <Script
            src="https://unpkg.com/@tinybirdco/flock.js"
            data-host="https://api.tinybird.co"
            data-token={process.env.NEXT_PUBLIC_TINYBIRD_TOKEN}
          />
        )}
      </body>
    </html>
  )
}

export const metadata = {
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true
  },
  title: {
    template: `%s — ${sharedTitle}`,
    default: sharedTitle
  },
  description: sharedDescription,
  openGraph: {
    title: {
      template: `%s — ${sharedTitle}`,
      default: sharedTitle
    },
    description: sharedDescription,
    alt: sharedTitle,
    type: 'website',
    url: '/',
    siteName: sharedTitle,
    locale: 'en_IE'
  },
  alternates: {
    canonical: '/'
  },
  twitter: {
    card: 'summary_large_image'
  },
  other: {
    pinterest: 'nopin'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#171719'
}
