// Client reale per l'API v2 di CJ Dropshipping.
// Endpoint ufficiali: https://developers.cjdropshipping.com/api2.0/v1
// Auth: POST /authentication/getAccessToken  (body: email + password = API Key)
// Prodotti: GET /product/list  (header: CJ-Access-Token)

const BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

let cached: { token: string; expiry: number } | null = null

async function getToken(): Promise<string | null> {
  const direct = process.env.CJ_ACCESS_TOKEN
  if (direct) return direct
  const email = process.env.CJ_EMAIL
  const apiKey = process.env.CJ_API_KEY
  if (!email || !apiKey) return null

  const now = Date.now()
  if (cached && cached.expiry > now) return cached.token

  try {
    const res = await fetch(BASE + '/authentication/getAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: apiKey }),
    })
    const json: any = await res.json().catch(() => null)
    const token = json && json.data && json.data.accessToken
    if (!token) return null
    // L'access token CJ dura 180 giorni; mettiamo in cache 23h per sicurezza.
    cached = { token, expiry: now + 23 * 60 * 60 * 1000 }
    return token
  } catch {
    return null
  }
}

export type CjProduct = {
  id: string
  name: string
  image: string
  cost: number
  category: string
  popularity: number
}

function firstNumber(v: any): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const m = v.match(/[0-9]+(\.[0-9]+)?/)
    if (m) return parseFloat(m[0])
  }
  return 0
}

function mapProduct(raw: any): CjProduct {
  const img =
    raw.productImage ||
    raw.image ||
    (Array.isArray(raw.productImageSet) ? raw.productImageSet[0] : '') ||
    ''
  return {
    id: String(raw.pid || raw.productId || raw.id || ''),
    name: raw.productNameEn || raw.productName || raw.nameEn || 'Prodotto CJ',
    image: img,
    cost: firstNumber(raw.sellPrice != null ? raw.sellPrice : raw.price),
    category: raw.categoryName || raw.category || 'Generale',
    popularity: firstNumber(
      raw.listedNum != null ? raw.listedNum : raw.sellNum != null ? raw.sellNum : 0
    ),
  }
}

export async function searchCjProducts(opts: {
  keyword?: string
  pageSize?: number
  pageNum?: number
}): Promise<{ ok: boolean; products: CjProduct[]; error?: string }> {
  const token = await getToken()
  if (!token) return { ok: false, products: [], error: 'no-credentials' }

  const params = new URLSearchParams()
  params.set('pageNum', String(opts.pageNum && opts.pageNum > 0 ? opts.pageNum : 1))
  params.set('pageSize', String(opts.pageSize || 20))
  if (opts.keyword) params.set('productNameEn', opts.keyword)

  try {
    const res = await fetch(BASE + '/product/list?' + params.toString(), {
      headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json' },
    })
    const json: any = await res.json().catch(() => null)
    const list = json && json.data && (json.data.list || json.data.content)
    if (!Array.isArray(list)) {
      return {
        ok: false,
        products: [],
        error: (json && json.message) || 'Risposta CJ non valida',
      }
    }
    const products = list.map(mapProduct).filter((p: CjProduct) => p.id && p.cost > 0)
    return { ok: true, products }
  } catch (e) {
    return { ok: false, products: [], error: String(e) }
  }
}
