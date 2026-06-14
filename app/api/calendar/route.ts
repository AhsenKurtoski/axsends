import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

// Piano editoriale di 7 giorni generato dall'AI.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const niche = (b && b.niche ? String(b.niche) : 'dropshipping').trim()
  const platform = (b && b.platform ? String(b.platform) : 'TikTok').trim()

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare il calendario.',
      plan: null,
    })
  }

  const system =
    'Sei uno stratega di social media marketing. Scrivi in italiano, idee concrete e pronte da girare.'
  const prompt =
    'Crea un piano editoriale di 7 giorni per ' + platform + ' nella nicchia "' + niche + '". ' +
    'Restituisci un JSON con: days (array di 7 oggetti con day, idea, hook, format, hashtags array di 4 con #).'

  const data = await generateJson(system, prompt)
  if (!data || !data.days) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
      plan: null,
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Calendario generato con AI (' + aiProvider() + ').',
    plan: data,
  })
}
