import { isDevelopment } from '@/lib/utils'

async function fetchGraphQL(query, preview = isDevelopment) {
  const accessToken = preview ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN : process.env.CONTENTFUL_ACCESS_TOKEN
  if (!process.env.CONTENTFUL_SPACE_ID || !accessToken) return undefined

  try {
    const res = await fetch(`https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query })
    })
    if (!res.ok) return undefined
    return res.json()
  } catch {
    return undefined
  }
}

export async function getPageSeo(slug, preview = isDevelopment) {
  const entry = await fetchGraphQL(
    `query {
      pageCollection(where: { slug: "${slug}" }, preview: ${preview}, limit: 1) {
        items {
          seo {
            title
            description
            ogImageTitle
            ogImageSubtitle
          }
        }
      }
    }`,
    preview
  )

  return entry?.data?.pageCollection?.items?.[0]
}

export async function getAllPageSlugs(preview = isDevelopment) {
  const entries = await fetchGraphQL(
    `query {
      pageCollection(preview: ${preview}) {
        items {
          slug
          hasCustomPage
        }
      }
    }`,
    preview
  )

  return entries?.data?.pageCollection?.items ?? []
}

export async function getPage(slug, preview = isDevelopment) {
  const entry = await fetchGraphQL(
    `query {
      pageCollection(where: { slug: "${slug}" }, preview: ${preview}, limit: 1) {
        items {
          title
          slug
          content {
            json
            links {
              assets {
                block {
                  sys {
                    id
                  }
                  url
                  title
                  width
                  height
                  description
                }
              }
              entries {
                inline {
                  sys {
                    id
                  }
                  __typename
                  ... on ContentEmbed {
                    title
                    embedUrl
                    type
                  }
                  ... on CodeBlock {
                    title
                    language
                    code
                  }
                }
              }
            }
          }
          sys {
            id
            firstPublishedAt
            publishedAt
          }
        }
      }
    }`,
    preview
  )

  return entry?.data?.pageCollection?.items?.[0]
}

export async function getAllLogbook(preview = isDevelopment) {
  const entries = await fetchGraphQL(
    `query {
      logbookCollection(order: date_DESC, preview: ${preview}) {
        items {
          title
          date
          description
          image {
            url
            title
            description
            width
            height
          }
        }
      }
    }`,
    preview
  )

  return entries?.data?.logbookCollection?.items ?? []
}
