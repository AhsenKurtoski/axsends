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
    'Sei uno stratega di contenuti social senior. Progetti piani editoriali eseguibili da una persona sola con un telefono. ' +
    'Scrivi in italiano, con idee concrete e hook gia pronti da dire davanti alla camera. Non proponi trend rischiosi o claim falsi.'
  const prompt =
    'Crea un piano editoriale di 7 giorni per ' + platform + ' nella nicchia "' + niche + '". ' +
    'Ogni giorno deve avere un formato diverso (tutorial, unboxing, POV, prima/dopo, lista, dietro le quinte, domanda al pubblico) e un hook nei primi 2 secondi. ' +
    'Restituisci un JSON con: days (array di 7 oggetti con day, idea (cosa girare, in 1 frase), hook (frase esatta da dire), format, ' +
    'onScreenText (3-6 parole da mostrare a schermo), bestTime (fascia oraria consigliata), hashtags (array di 5 con #, misti grandi e di nicchia)).'

  const data = await generateJson(system, prompt, { maxTokens: 1600, budgetMs: 45_000 })
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
