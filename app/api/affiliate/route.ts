import { NextResponse, NextRequest } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { validateBody, affiliateBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

// Contenuti promozionali per affiliate marketing — AhsenDS
// Costruito da Ahsen Kurtoski

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.ai(req)
  if (rateLimitResponse) return rateLimitResponse
  const validation = await validateBody(req, affiliateBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { product, platform, network: rawNetwork, link, tone } = validation.data
  const network = rawNetwork || platform || 'Amazon'

  // La disclosure e' un obbligo legale, non un contenuto generato: la teniamo
  // sempre, anche se l'AI riscrive il resto.
  const disclosure =
    'Disclosure: contenuto con link affiliati ' + network +
    '. Acquistando dal link posso ricevere una commissione, senza costi extra per te.'

  // Nessuna simulazione: senza chiave AI non inventiamo caption o hashtag.
  if (!aiConfigured()) {
    return NextResponse.json(
      {
        error:
          'Nessuna AI configurata. Imposta GROQ_API_KEY, OPENROUTER_API_KEY o GEMINI_API_KEY in .env.local per generare i contenuti affiliate.',
      },
      { status: 503 }
    )
  }

  const system =
    'Sei un social media marketer esperto di affiliate marketing. Scrivi in italiano, naturale e adatto a ' +
    network + '. Tono: ' + (tone || 'energico') + '.'
  const prompt =
    'Genera contenuti per promuovere "' + product + '" tramite link affiliato ' + network + '. ' +
    'Restituisci un JSON con: title (stringa), body (2-3 frasi), captions (array di 3 caption brevi e diverse), ' +
    'hashtags (array di 6 hashtag con #), cta (stringa breve).'

  const data = await generateJson(system, prompt)
  if (!data || !data.title) {
    return NextResponse.json(
      {
        error:
          'L AI non ha restituito contenuti validi. Riprova tra poco o controlla la chiave nella pagina Diagnostica.',
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    provider: aiProvider(),
    title: data.title,
    body: data.body || '',
    captions: Array.isArray(data.captions) ? data.captions : [data.captions].filter(Boolean),
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    disclosure: data.disclosure || disclosure,
    cta: data.cta || '',
    platform: network,
    link: link || '',
  })
}
