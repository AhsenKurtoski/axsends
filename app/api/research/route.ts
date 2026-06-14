import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct } from '@/lib/products'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Parole chiave di default: se l'utente non cerca nulla, ne scegliamo una a caso
// cosi ogni apertura mostra prodotti diversi (niente sempre gli stessi).
const DEFAULT_KEYWORDS = [
  'gadget', 'kitchen', 'fitness', 'pet', 'beauty', 'home decor',
  'phone accessory', 'travel', 'car accessory', 'led light', 'baby', 'outdoor',
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'score'
  const pageParam = parseInt(searchParams.get('page') || '0', 10)
  // Pagina casuale 1-5 cosi i risultati cambiano ad ogni ricerca.
  const page = pageParam > 0 ? pageParam : 1 + Math.floor(Math.random() * 5)
  const effectiveKeyword = keyword || DEFAULT_KEYWORDS[Math.floor(Math.random() * DEFAULT_KEYWORDS.length)]

  const cj = await searchCjProducts({ keyword: effectiveKeyword, pageSize: 20, pageNum: page })

  if (!cj.ok || cj.products.length === 0) {
    return NextResponse.json({
      source: 'none',
      configured: cj.error !== 'no-credentials',
      keyword: effectiveKeyword,
      page,
      note:
        cj.error === 'no-credentials'
          ? 'Aggiungi CJ_EMAIL e CJ_API_KEY in .env.local per cercare prodotti reali su CJ Dropshipping.'
          : 'Nessun prodotto trovato per questa ricerca. Prova un altra parola chiave o premi Mescola.',
      error: cj.error && cj.error !== 'no-credentials' ? cj.error : undefined,
      products: [],
    })
  }

  const base: BaseProduct[] = cj.products
  const scored = base.map((p) => {
    const s = scoreProduct(p.cost, p.popularity)
    const suggestedPrice = Math.round(p.cost * MARKUP * 100) / 100
    const margin = Math.round(((suggestedPrice - p.cost) / suggestedPrice) * 100)
    const competitorLow = Math.round(suggestedPrice * 0.85 * 100) / 100
    const competitorHigh = Math.round(suggestedPrice * 1.2 * 100) / 100
    return { ...p, suggestedPrice, margin, score: s.score, label: s.label, competitorLow, competitorHigh }
  })

  if (sort === 'trending') scored.sort((a, b) => b.popularity - a.popularity)
  else if (sort === 'margin') scored.sort((a, b) => b.margin - a.margin)
  else scored.sort((a, b) => b.score - a.score)

  return NextResponse.json({
    source: 'cj',
    keyword: effectiveKeyword,
    page,
    note: 'Prodotti reali da CJ Dropshipping (ricerca: ' + effectiveKeyword + ', pagina ' + page + ').',
    products: scored,
  })
}
