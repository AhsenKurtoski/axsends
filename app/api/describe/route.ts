import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Generazione automatica di descrizione prodotto + titolo SEO + tag.
// Deterministica: funziona sempre, senza dipendenze esterne.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const name = (b && b.name ? String(b.name) : 'Prodotto').trim()
  const category = (b && b.category ? String(b.category) : 'lifestyle').trim()
  const price = b && b.price ? b.price : null

  const bullets = [
    'Design pratico e moderno che si adatta a ogni esigenza',
    'Materiali di qualita pensati per durare nel tempo',
    'Facile da usare, risultati immediati fin dal primo utilizzo',
    'Perfetto come regalo o per uso quotidiano',
  ]

  const title = name + ' - ' + category + ' premium' + (price ? ' a soli ' + price + '€' : '')
  const description =
    name +
    ' e la soluzione che stavi cercando. ' +
    bullets.join('. ') +
    '.\n\nMigliaia di clienti soddisfatti lo hanno gia scelto. Spedizione tracciata e reso facile. ' +
    'Ordina ora ' +
    name +
    ' e scopri la differenza!'
  const tags = [
    category.toLowerCase(),
    'offerta',
    'novita',
    'trending',
    'spedizione veloce',
    name.toLowerCase().split(' ')[0],
  ]

  return NextResponse.json({ title, description, bullets, tags })
}
