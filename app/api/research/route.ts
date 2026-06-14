import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct, demoProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'score'

  const cj = await searchCjProducts({ keyword, pageSize: 20 })

  let source = 'cj'
  let base: BaseProduct[]
  if (cj.ok && cj.products.length > 0) {
    base = cj.products
  } else {
    source = 'demo'
    const k = keyword.toLowerCase()
    base = demoProducts.filter((p) => !k || p.name.toLowerCase().includes(k))
  }

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
    source,
    note:
      source === 'cj'
        ? 'Prodotti reali da CJ Dropshipping.'
        : 'Modalita demo: aggiungi CJ_EMAIL e CJ_API_KEY in .env.local per prodotti reali da CJ Dropshipping.',
    error: cj.error && cj.error !== 'no-credentials' ? cj.error : undefined,
    products: scored,
  })
}
