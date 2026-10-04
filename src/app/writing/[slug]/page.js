import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ScrollArea } from '@/components/scroll-area'
import { Markdown } from '@/components/markdown'
import { PageTitle } from '@/components/page-title'
import { FloatingHeader } from '@/components/floating-header'
import { Views } from '@/components/views'
import { LikeButton } from '@/components/like-button'
import { MediaGallery, MediaHero } from '@/components/media-gallery'
import { getPost, getAllPostSlugs } from '@/lib/posts'
import { getDateTimeFormat } from '@/lib/utils'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getAllPostSlugs()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function WritingSlug({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const { id, title, description, body, published_at, updated_at, like_count, cover, images } = post
  const displayTitle = title || 'Untitled'

  const dateString = getDateTimeFormat(published_at)
  const datePublished = new Date(published_at).toISOString()
  const dateModified = new Date(updated_at).toISOString()

  const gallery = images.filter((image) => image.url !== cover?.url)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: displayTitle,
    ...(description && { description }),
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: 'Anton Kuznetsov'
    },
    ...(cover?.url && { image: cover.url }),
    ...(process.env.NEXT_PUBLIC_SITE_URL && { url: `${process.env.NEXT_PUBLIC_SITE_URL}/writing/${slug}` })
  }

  return (
    <>
      <ScrollArea className="flex flex-col bg-[#171719]" hasScrollTitle>
        <FloatingHeader scrollTitle={displayTitle} goBackLink="/writing">
          <Views slug={slug} />
        </FloatingHeader>
        <div className="content-wrapper">
          <article className="content">
            <PageTitle
              title={displayTitle}
              subtitle={
                <div className="flex flex-col gap-2">
                  {description && <p className="mb-0 text-[#a1a0a5]">{description}</p>}
                  <time dateTime={published_at} className="text-gray-400">
                    {dateString}
                  </time>
                </div>
              }
              className="mb-6"
            />

            <MediaHero image={cover} className="mb-6" />

            {body && <Markdown>{body}</Markdown>}

            {gallery.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4">Images</h2>
                <MediaGallery images={gallery} />
              </section>
            )}

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#343438] pt-6 lg:mt-12">
              <LikeButton postId={id} initialCount={like_count} />
              <Link href="/writing" className="link text-sm">
                More writing
              </Link>
            </div>
          </article>
        </div>
      </ScrollArea>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }} />
    </>
  )
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return null

  const title = post.title || 'Untitled'
  const description = post.description || 'An article by Anton Kuznetsov.'
  const siteUrl = `/writing/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: new Date(post.published_at).toISOString(),
      modifiedTime: new Date(post.updated_at).toISOString(),
      url: siteUrl,
      ...(post.cover?.url && { images: [{ url: post.cover.url }] })
    },
    alternates: {
      canonical: siteUrl
    }
  }
}