const RAINDROP_API_URL = 'https://api.raindrop.io/rest/v1'

async function fetchRaindrop(path) {
  // Read inside the function, not at module scope. Worker runtime bindings are
  // applied to process.env after the bundle is evaluated, so a module-scope read
  // would always come back empty. See src/lib/admin-supabase.js.
  const accessToken = process.env.RAINDROP_ACCESS_TOKEN
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
