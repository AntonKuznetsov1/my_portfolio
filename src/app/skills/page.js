import { CodeIcon, GraduationCapIcon, WrenchIcon } from 'lucide-react'

import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { FloatingHeader } from '@/components/floating-header'
import { SERVICES, SKILLS } from '@/lib/constants'

export const metadata = {
  title: 'Skills',
  description: 'Web development, design, and client services offered by Anton Kuznetsov.'
}

export default function Skills() {
  return (
    <ScrollArea className="flex flex-col" hasScrollTitle>
      <FloatingHeader scrollTitle="Skills" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Skills &amp; services" />
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2">
              <CodeIcon size={20} className="text-[#f0a878]" /> Tools &amp; technologies
            </h2>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <span key={skill} className="rounded-lg border border-[#3b3b40] bg-[#1b1b1e] px-3 py-2 font-sans text-sm font-normal text-[#dedde0]">
                  {skill}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 flex items-center gap-2">
              <WrenchIcon size={20} className="text-[#f0a878]" /> Services
            </h2>
            <ul className="flex flex-col gap-3 pl-5 marker:text-[#f0a878]">
              {SERVICES.map((service) => (
                <li key={service} className="pl-1">{service}</li>
              ))}
            </ul>
          </section>
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2">
              <GraduationCapIcon size={20} className="text-[#f0a878]" /> Education
            </h2>
            <p>Fredericton High School · Fredericton, New Brunswick</p>
          </section>
          <p className="mt-8 rounded-xl border border-dashed border-[#3b3b40] bg-[#1b1b1e] px-5 py-4 text-sm text-[#a1a0a5]">
            These reflect the tools and services Anton has shared so far. Project examples and experience levels will be
            added as he provides them.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
