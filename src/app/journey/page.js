import { PlusIcon } from 'lucide-react'

import { ScrollArea } from '@/components/scroll-area'
import { JourneyCard } from '@/components/journey-card'
import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { GradientBg3 } from '@/components/gradient-bg'
import { getAllLogbook, getPageSeo } from '@/lib/contentful'

/**
 * Shown until the logbook is populated from Contentful. These are plain
 * objects in the shape getAllLogbook returns, so the page renders them through
 * the same mapping and the switch to real entries changes nothing but the data.
 *
 * Descriptions are written to exercise the layout rather than to be read: one
 * short line, one long paragraph, and one with a list and a link, at very
 * different lengths. That way the timeline is checked against the worst cases
 * before any real content exists. Keep the shape, not the wording.
 */
const PLACEHOLDER_LOGBOOK = [
  {
    title: 'First steps',
    date: '2024-02-12',
    description: 'Where the journey begins.'
  },
  {
    title: 'Learning the fundamentals',
    date: '2024-06-03',
    description:
      'HTML, CSS and JavaScript, slowly and then all at once. This entry is deliberately long so the timeline can be checked against a full paragraph of copy rather than a neat single sentence, because real writing never stays tidy for long.'
  },
  {
    title: 'Building for the web',
    date: '2025-01-20',
    description:
      'Moving from static pages to real applications.\n\n- Interfaces that hold up on a phone\n- Data that survives a reload\n- Details that most people never notice\n\nMore at [the projects page](/projects).'
  },
  {
    title: 'Working with people',
    date: '2025-09-08',
    description: 'Turning a rough idea into something someone else can actually use.'
  }
]

async function fetchData() {
  const allLogbook = await getAllLogbook()

  const source = allLogbook?.length ? allLogbook : PLACEHOLDER_LOGBOOK

  const mappedLogbook = []
  source.map((log) => {
    const year = new Date(log.date).getFullYear()
    const existingYear = mappedLogbook.find((item) => item?.year === year)
    if (!existingYear) mappedLogbook.push({ year, logs: [log] })
    else existingYear.logs.push(log)
  })

  return { allLogbook: mappedLogbook }
}

export default async function Journey() {
  const { allLogbook } = await fetchData()

  return (
    <ScrollArea className="flex flex-col" hasScrollTitle>
      <GradientBg3 />
      <FloatingHeader scrollTitle="Journey" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Journey" />
          <div className="flex flex-col items-stretch gap-12">
            {allLogbook.map((item, itemIndex) => (
              <div key={`data_${itemIndex}`} className="flex flex-col items-baseline gap-6 md:flex-row md:gap-12">
                <div className="flex items-center">
                  <h2>{item.year}</h2>
                  <hr className="my-0 ml-4 flex-1 border-dashed border-[#343a45]" />
                </div>
                <section>
                  {item.logs.map((log, logIndex) => (
                    <div key={`data_${itemIndex}_log_${logIndex}`} className="relative flex pb-8 last:pb-0">
                      {logIndex !== item.logs.length - 1 && (
                        <div className="absolute inset-0 flex w-6 items-center justify-center">
                          <div className="pointer-events-none h-full w-px border-l-[1px] border-[#343a45]"></div>
                        </div>
                      )}
                      <div className="z-0 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#29292d] align-middle text-[#f0a878]">
                        <PlusIcon size={16} />
                      </div>
                      <div className="flex-grow pl-8">
                        <JourneyCard {...log} index={logIndex} />
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export async function generateMetadata() {
  const seoData = await getPageSeo('journey')
  if (!seoData) return null

  const {
    seo: { title, description }
  } = seoData
  const siteUrl = '/journey'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteUrl
    },
    alternates: {
      canonical: siteUrl
    }
  }
}
