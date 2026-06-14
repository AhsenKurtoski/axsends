import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct, demoProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Nicchie scansionate automaticamente dal radar
const NICHES = ['kitchen gadget', 'fitness', 'pet', 'beauty tool', 'home decor', 'phone accessory']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function GET() {
  const map = new Map<string, BaseProduct>()
  let source = 'demo'

  // Prima ricerca: verifica anche se le credenziali CJ sono attive
  const probe = await searchCjProducts({ keyword: NICHES[0], pageSize: 10 })
  if (probe.ok) {
    source = 'cj'
    probe.products.forEach((p) => map.set(p.id, p))
    for (let i = 1; i < NICHES.length; i++) {
      // Rispetta il rate limit del piano free CJ (1 richiesta/secondo)
      await sleep(1100)
      const r = await searchCjProducts({ keyword: NICHES[i], pageSize: 10 })
      if (r.ok) r.products.forEach((p) => map.set(p.id, p))
    }
  } else {
    demoProducts.forEach((p) => map.set(p.id, p))
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
    source,
    scannedAt: new Date().toISOString(),
    niches: NICHES,
    count: top.length,
    note:
      source === 'cj'
        ? 'Radar: scansione automatica multi-nicchia su CJ Dropshipping.'
        : 'Demo: collega CJ (CJ_EMAIL + CJ_API_KEY) per la scansione reale.',
    products: top,
  })
}
