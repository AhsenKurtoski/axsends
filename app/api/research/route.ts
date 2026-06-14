import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct } from '@/lib/products'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'score'

  const cj = await searchCjProducts({ keyword, pageSize: 20 })

  if (!cj.ok || cj.products.length === 0) {
    return NextResponse.json({
      source: 'none',
      configured: cj.error !== 'no-credentials',
      note:
        cj.error === 'no-credentials'
          ? 'Aggiungi CJ_EMAIL e CJ_API_KEY in .env.local per cercare prodotti reali su CJ Dropshipping.'
          : 'Nessun prodotto trovato per questa ricerca.',
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

  return NextResponse.json({ source: 'cj', note: 'Prodotti reali da CJ Dropshipping.', products: scored })
}
