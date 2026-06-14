import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Crea un prodotto digitale vendibile (ebook/guida) con contenuto reale scritto dall'AI.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const topic = (b && b.topic ? String(b.topic) : 'guida pratica').trim()
  const audience = (b && b.audience ? String(b.audience) : 'principianti').trim()

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare il prodotto digitale.',
      product: null,
    })
  }

  const system =
    'Sei un autore esperto che crea prodotti digitali vendibili (ebook e guide). Scrivi in italiano, contenuti reali e utili, niente testo riempitivo.'
  const prompt =
    'Crea un prodotto digitale vendibile sul tema "' + topic + '" per "' + audience + '". ' +
    'Restituisci un JSON con: title, subtitle, price (numero euro tra 9 e 29), ' +
    'outline (array di 5 oggetti con chapter e content, dove content e 80-120 parole di vero contenuto utile), ' +
    'salesPitch (2-3 frasi per venderlo), where (array di 3 piattaforme dove venderlo).'

  const data = await generateJson(system, prompt)
  if (!data || !data.title) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
      product: null,
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Prodotto digitale generato con AI (' + aiProvider() + ').',
    product: data,
  })
}
