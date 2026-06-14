import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MARKUP = 2.8

type BaseProduct = {
  id: string
  name: string
  image: string
  cost: number
  category: string
  popularity: number
}

type Scored = BaseProduct & {
  suggestedPrice: number
  margin: number
  score: number
  label: string
}

function scoreProduct(cost: number, popularity: number): { score: number; label: string } {
  const suggested = cost * MARKUP
  const profit = suggested - cost
  const marginScore = Math.min(40, profit / 1.5)
  let priceScore = 6
  if (suggested >= 15 && suggested <= 60) priceScore = 30
  else if (suggested >= 8 && suggested < 15) priceScore = 18
  else if (suggested > 60 && suggested <= 90) priceScore = 15
  const popScore = Math.min(30, Math.log10(popularity + 1) * 12)
  const total = Math.round(Math.max(0, Math.min(100, marginScore + priceScore + popScore)))
  let label = 'Da valutare'
  if (total >= 75) label = 'Winning 🔥'
  else if (total >= 55) label = 'Buon potenziale'
  else if (total >= 35) label = 'Medio'
  return { score: total, label }
}

const demoRaw: BaseProduct[] = [
  { id: 'd1', name: 'Anello smart per il monitoraggio del sonno', image: '💍', cost: 11.2, category: 'Wearable', popularity: 8400 },
  { id: 'd2', name: 'Massaggiatore cervicale EMS', image: '💆', cost: 7.9, category: 'Benessere', popularity: 15200 },
  { id: 'd3', name: 'Mini aspirapolvere portatile USB', image: '🧹', cost: 9.1, category: 'Casa', popularity: 22000 },
  { id: 'd4', name: 'Proiettore galassia LED', image: '🌌', cost: 8.7, category: 'Casa', popularity: 31000 },
  { id: 'd5', name: 'Spazzola lisciante ionica', image: '💇', cost: 12.5, category: 'Beauty', popularity: 9800 },
  { id: 'd6', name: 'Supporto laptop pieghevole in alluminio', image: '💻', cost: 5.6, category: 'Ufficio', popularity: 4300 },
  { id: 'd7', name: 'Collare GPS per animali', image: '🐾', cost: 14.2, category: 'Pet', popularity: 5400 },
  { id: 'd8', name: 'Borraccia termica smart con display', image: '🍶', cost: 6.4, category: 'Lifestyle', popularity: 6100 },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''

  const cj = await searchCjProducts({ keyword, pageSize: 20 })

  let source = 'cj'
  let base: BaseProduct[]
  if (cj.ok && cj.products.length > 0) {
    base = cj.products
  } else {
    source = 'demo'
    const k = keyword.toLowerCase()
    base = demoRaw.filter((p) => !k || p.name.toLowerCase().includes(k))
  }

  const scored: Scored[] = base.map((p) => {
    const s = scoreProduct(p.cost, p.popularity)
    const suggestedPrice = Math.round(p.cost * MARKUP * 100) / 100
    const margin = Math.round(((suggestedPrice - p.cost) / suggestedPrice) * 100)
    return { ...p, suggestedPrice, margin, score: s.score, label: s.label }
  })
  scored.sort((a, b) => b.score - a.score)

  return NextResponse.json({
    source,
    note:
      source === 'cj'
        ? 'Prodotti reali da CJ Dropshipping, ordinati per punteggio di potenziale.'
        : 'Modalita demo: aggiungi CJ_EMAIL e CJ_API_KEY in .env.local per prodotti reali da CJ Dropshipping.',
    error: cj.error && cj.error !== 'no-credentials' ? cj.error : undefined,
    products: scored,
  })
}
