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
    'Sei un consulente CRO e copywriter di landing page e-commerce di alto livello. ' +
    'Scrivi in italiano persuasivo ma onesto, con la struttura che converte: promessa chiara, meccanismo, prove, obiezioni, offerta, CTA. ' +
    'Non inventi numeri di clienti, recensioni, certificazioni o garanzie legali che non esistono.'
  const prompt =
    'Crea il testo completo di una landing page che vende "' + product + '". ' +
    'Pubblico: ' + audience + '. ' + (price ? 'Prezzo: ' + price + ' euro. ' : '') +
    'Restituisci un JSON con: headline (promessa concreta, max 12 parole), subheadline (chiarisce per chi e e cosa cambia), ' +
    'benefits (array di 4 benefici espressi come risultato, non come caratteristica), ' +
    'bullets (array di 5 dettagli pratici: materiali, misure, uso, spedizione, assistenza), ' +
    'faq (array di 4 oggetti con q e a che risolvono obiezioni reali prima dell acquisto), ' +
    'guarantee (stringa di garanzia realistica), ' +
    'socialProof (stringa di prova sociale credibile e non numerica se non hai dati), ' +
    'cta (testo del bottone, max 4 parole).'

  const data = await generateJson(system, prompt, { maxTokens: 1800, budgetMs: 45_000 })
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
