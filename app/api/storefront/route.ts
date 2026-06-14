import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

// Genera il testo completo di una landing page di vendita con AI. Modo di guadagno: vendita diretta.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const product = (b && b.product ? String(b.product) : 'Prodotto').trim()
  const price = b && b.price ? b.price : ''
  const audience = (b && b.audience ? String(b.audience) : 'pubblico ampio').trim()

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare la landing con AI.',
      page: null,
    })
  }

  const system =
    'Sei un esperto di landing page e CRO per e-commerce. Scrivi in italiano persuasivo, chiaro e onesto, orientato alla conversione.'
  const prompt =
    'Crea il testo completo di una landing page che vende "' + product + '". ' +
    'Pubblico: ' + audience + '. ' + (price ? 'Prezzo: ' + price + ' euro. ' : '') +
    'Restituisci un JSON con: headline (titolo forte), subheadline (sottotitolo), ' +
    'benefits (array di 4 benefici brevi), bullets (array di 5 caratteristiche), ' +
    'faq (array di 4 oggetti con q e a), guarantee (stringa garanzia), ' +
    'socialProof (stringa con prova sociale credibile), cta (testo del bottone).'

  const data = await generateJson(system, prompt)
  if (!data || !data.headline) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
      page: null,
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Landing generata con AI (' + aiProvider() + ').',
    page: data,
  })
}
