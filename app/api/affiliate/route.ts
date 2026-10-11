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

  const disclosure =
    'Disclosure: contenuto con link affiliati ' + network +
    '. Acquistando dal link posso ricevere una commissione, senza costi extra per te.'

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare contenuti affiliate con AI.',
      title: 'Scopri ' + product,
      body: 'Recensione e guida all acquisto di ' + product + ' su ' + network + '.',
      captions: [
        'Ecco perche tutti parlano di ' + product + '! Link in bio.',
        'Miglior scelta per il rapporto qualita prezzo: ' + product + '.',
        'Offerta speciale limitata su ' + network + ' per ' + product + '!',
      ],
      hashtags: ['#affiliate', '#offerta', '#shopping', '#recensione'],
      disclosure,
      cta: 'Tocca il link per scoprire ' + product + ' su ' + network + '.',
      platform: network,
      link: link || '',
    })
  }

  const system =
    'Sei un social media marketer esperto di affiliate marketing. Scrivi in italiano, naturale e adatto a ' +
    network + '. Tono: ' + (tone || 'energico') + '.'
  const prompt =
    'Genera contenuti per promuovere "' + product + '" tramite link affiliato ' + network + '. ' +
    'Restituisci un JSON con: title (stringa), body (2-3 frasi), captions (array di 3 caption brevi e diverse), ' +
    'hashtags (array di 6 hashtag con #), cta (stringa breve).'

  const data = await generateJson(system, prompt)
  if (!data) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto, riprova tra poco.',
      title: product,
      body: 'Recensione per ' + product + ' su ' + network + '.',
      captions: ['Scopri ' + product + ' con la migliore offerta online!'],
      hashtags: ['#affiliate', '#shopping'],
      disclosure,
      cta: 'Visita il link su ' + network,
      platform: network,
      link: link || '',
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    title: data.title || product,
    body: data.body || '',
    captions: Array.isArray(data.captions) ? data.captions : [data.captions].filter(Boolean),
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    disclosure: data.disclosure || disclosure,
    cta: data.cta || ('Tocca il link per ' + product + ' su ' + network + '.'),
    platform: network,
    link: link || '',
    developer: 'Ahsen Kurtoski',
  })
}
