import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

// Idee di design print-on-demand (slogan + concept grafico) per vendere su Redbubble/Etsy/Merch.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const niche = (b && b.niche ? String(b.niche) : 'gatti').trim()

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi una chiave AI (Groq/OpenRouter/Gemini) in .env.local.',
      designs: [],
      platforms: [],
    })
  }

  const system =
    'Sei un designer print-on-demand di successo (Redbubble, Etsy, Merch by Amazon). Crei slogan e concept grafici che vendono. Scrivi in italiano.'
  const prompt =
    'Genera 6 idee di design print-on-demand per la nicchia "' + niche + '". ' +
    'Restituisci un JSON con: designs (array di 6 oggetti con slogan, concept (descrizione grafica pronta da dare a un designer o a un AI di immagini), product (es. t-shirt, tazza, poster), audience), ' +
    'platforms (array di 3 piattaforme dove venderli).'

  const data = await generateJson(system, prompt)
  if (!data || !data.designs) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
      designs: [],
      platforms: [],
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Design generati con AI (' + aiProvider() + ').',
    designs: Array.isArray(data.designs) ? data.designs : [],
    platforms: Array.isArray(data.platforms) ? data.platforms : [],
  })
}
