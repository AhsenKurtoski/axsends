import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Contenuti promozionali per un link affiliato, scritti dall'AI (Groq/Gemini).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any
  const product = (body && body.product) || 'questo prodotto'
  const link = (body && body.link) || ''
  const platform = (body && body.platform) || 'TikTok'
  const network = (body && body.network) || 'Amazon'

  const disclosure =
    'Disclosure: contenuto con link affiliati ' + network +
    '. Acquistando dal link posso ricevere una commissione, senza costi extra per te.'

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare contenuti affiliate con AI.',
      title: null,
      body: '',
      captions: [],
      hashtags: [],
      disclosure,
      cta: '',
      platform,
    })
  }

  const system =
    'Sei un social media marketer esperto di affiliate marketing. Scrivi in italiano, naturale e adatto a ' +
    platform + '.'
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
      title: null,
      body: '',
      captions: [],
      hashtags: [],
      disclosure,
      cta: '',
      platform,
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    title: data.title || product,
    body: data.body || '',
    captions: Array.isArray(data.captions) ? data.captions : [],
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    disclosure: data.disclosure || disclosure,
    cta: data.cta || ('Tocca il link per ' + product + ' su ' + network + '.'),
    platform,
    link,
  })
}
