import { NextResponse, NextRequest } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { validateBody, generateAdBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { generateImage } from '@/lib/hf'
import { adSystemPrompt, adPrompt, adStrictSuffix, buildAdScript, type AdRequest } from '@/lib/adkit'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Genera il pacchetto pubblicitario completo: script, storyboard con testo a
// schermo, sottotitoli SRT/VTT, hashtag virali, descrizione pronta e immagini.

async function tryScript(b: AdRequest, strict: boolean) {
  const prompt = adPrompt(b) + (strict ? adStrictSuffix : '')
  const data = await generateJson(adSystemPrompt(), prompt, { maxTokens: 2200, budgetMs: 70_000 })
  return data
}

export async function POST(req: NextRequest) {
  // Rate limiting per API AI
  const rateLimitResponse = await rateLimitConfigs.ai(req)
  if (rateLimitResponse) return rateLimitResponse

  const validation = await validateBody(req, generateAdBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Nessuna simulazione: senza una chiave AI non inventiamo uno script.
  if (!aiConfigured()) {
    return NextResponse.json(
      {
        error:
          'Nessuna AI configurata. Imposta GROQ_API_KEY, OPENROUTER_API_KEY o GEMINI_API_KEY in .env.local: senza chiave non viene generato nessuno script.',
      },
      { status: 503 }
    )
  }

  const body = validation.data
  const first = await tryScript(body, false)
  const data = first && first.hook && Array.isArray(first.scenes) ? first : await tryScript(body, true)
  const script = buildAdScript(data, body)

  if (!script) {
    return NextResponse.json(
      {
        error:
          'L AI non ha restituito uno script valido. Riprova tra poco o controlla le chiavi nella pagina Diagnostica.',
      },
      { status: 502 }
    )
  }

  // Immagine verticale di copertina (gratuita, senza chiavi).
  const image = await generateImage(script.thumbnailPrompt, { width: 768, height: 1344 })

  return NextResponse.json({
    aiText: true,
    provider: aiProvider(),
    imageProvider: 'Pollinations (gratuito, senza chiave)',
    note: image
      ? 'Pacchetto completo generato con AI (' + aiProvider() + ' + Pollinations): script, sottotitoli SRT/VTT, hashtag, descrizione e copertina.'
      : 'Script e sottotitoli generati con AI (' + aiProvider() + '). Copertina non disponibile: il generatore immagini non ha risposto, riprova.',
    imagePrompt: script.thumbnailPrompt,
    image,
    script,
  })
}
