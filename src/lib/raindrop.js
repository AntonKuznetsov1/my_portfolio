const RAINDROP_API_URL = 'https://api.raindrop.io/rest/v1'
const accessToken = process.env.RAINDROP_ACCESS_TOKEN

async function fetchRaindrop(path) {
  if (!accessToken) return null

  try {
    const response = await fetch(`${RAINDROP_API_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getRaindrops(id, pageIndex = 0) {
  const query = new URLSearchParams({ page: String(pageIndex), perpage: '50' })
  return (await fetchRaindrop(`/raindrops/${id}?${query}`)) ?? { items: [] }
}

export async function getCollections() {
  return (await fetchRaindrop('/collections')) ?? { items: [] }
}

export async function getCollection(id) {
  return fetchRaindrop(`/collection/${id}`)
}
