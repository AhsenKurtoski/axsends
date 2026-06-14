import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

// Materiale per guadagnare come UGC creator: script, listino prezzi e email di proposta ai brand.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const product = (b && b.product ? String(b.product) : 'un prodotto').trim()

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare il materiale UGC.',
      data: null,
    })
  }

  const system =
    'Sei un UGC creator professionista che vende video ai brand. Scrivi in italiano, concreto e pronto all uso.'
  const prompt =
    'Per il prodotto/brand "' + product + '" crea il materiale per offrirti come UGC creator a pagamento. ' +
    'Restituisci un JSON con: scripts (array di 2 oggetti con hook, scenes array di 3 stringhe, cta), ' +
    'rateCard (array di 3 oggetti con pacchetto, prezzo numero euro, include stringa), ' +
    'pitchEmail (email professionale per proporti ai brand), ' +
    'tips (array di 3 consigli per trovare clienti).'

  const data = await generateJson(system, prompt)
  if (!data || !data.scripts) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
      data: null,
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Materiale UGC generato con AI (' + aiProvider() + ').',
    data,
  })
}
