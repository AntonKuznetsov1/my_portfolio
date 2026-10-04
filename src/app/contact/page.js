import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { FloatingHeader } from '@/components/floating-header'
import { ContactForm } from '@/components/contact-form'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with Anton Kuznetsov about a website or project.'
}

export default function Contact() {
  return (
    <ScrollArea className="flex flex-col" hasScrollTitle>
      <FloatingHeader scrollTitle="Contact" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Let’s talk." />
          <p className="mb-8">
            Need a business website, portfolio, landing page, or redesign? Send me a message and I’ll get back to you.
          </p>
          <ContactForm />
        </div>
      </div>
    </ScrollArea>
  )
}
