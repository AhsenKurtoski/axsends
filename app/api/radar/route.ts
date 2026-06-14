import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct } from '@/lib/products'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Nicchie scansionate automaticamente dal radar
const NICHES = ['kitchen gadget', 'fitness', 'pet', 'beauty tool', 'home decor', 'phone accessory']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Pagina casuale 1-4 per nicchia: ogni scansione trova prodotti diversi.
const rndPage = () => 1 + Math.floor(Math.random() * 4)

export async function GET() {
  const probe = await searchCjProducts({ keyword: NICHES[0], pageSize: 10, pageNum: rndPage() })

  if (!probe.ok) {
    return NextResponse.json({
      source: 'none',
      configured: probe.error !== 'no-credentials',
      scannedAt: new Date().toISOString(),
      niches: NICHES,
      count: 0,
      note:
        probe.error === 'no-credentials'
          ? 'Collega CJ (CJ_EMAIL + CJ_API_KEY) in .env.local per la scansione automatica reale.'
          : 'Scansione non riuscita: ' + (probe.error || 'errore sconosciuto'),
      products: [],
    })
  }

  const map = new Map<string, BaseProduct>()
  probe.products.forEach((p) => map.set(p.id, p))
  for (let i = 1; i < NICHES.length; i++) {
    // Rispetta il rate limit del piano free CJ (1 richiesta/secondo)
    await sleep(1100)
    const r = await searchCjProducts({ keyword: NICHES[i], pageSize: 10, pageNum: rndPage() })
    if (r.ok) r.products.forEach((p) => map.set(p.id, p))
  }

  const scored = Array.from(map.values()).map((p) => {
    const s = scoreProduct(p.cost, p.popularity)
    const suggestedPrice = Math.round(p.cost * MARKUP * 100) / 100
    const margin = Math.round(((suggestedPrice - p.cost) / suggestedPrice) * 100)
    const profit = Math.round((suggestedPrice - p.cost) * 100) / 100
    return { ...p, suggestedPrice, margin, profit, score: s.score, label: s.label }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, 12)

  return NextResponse.json({
    source: 'cj',
    scannedAt: new Date().toISOString(),
    niches: NICHES,
    count: top.length,
    note: 'Radar: scansione automatica multi-nicchia su CJ Dropshipping.',
    products: top,
  })
}
