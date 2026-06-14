import { NextResponse } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''
const IMAGE_MODEL = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'

type Body = {
  product?: string
  audience?: string
  tone?: string
  platform?: string
  price?: string | number
}

function fallbackScript(b: Body) {
  const product = (b.product || 'il tuo prodotto').trim()
  const audience = (b.audience || 'chi cerca qualcosa di nuovo').trim()
  const tone = b.tone || 'energico'
  const platform = b.platform || 'TikTok'
  const price = b.price ? 'solo ' + b.price + '\u20ac' : 'a un prezzo speciale'

  const hook = 'POV: hai appena scoperto ' + product + ' e non potrai piu farne a meno'

  const scenes = [
    { time: '0-2s', visual: 'Primo piano dinamico di ' + product + ' con luci al neon e zoom rapido', voiceover: 'Stop! Se sei ' + audience + ', guarda qui.' },
    { time: '2-6s', visual: 'Mostra il problema quotidiano che ' + product + ' risolve, taglio veloce', voiceover: 'Basta perdere tempo con soluzioni che non funzionano.' },
    { time: '6-12s', visual: 'Demo del prodotto in uso, testo a schermo con i 3 benefici principali', voiceover: product + ' e facile, veloce e ti cambia la giornata.' },
    { time: '12-16s', visual: 'Recensioni a 5 stelle che scorrono e badge spedizione veloce', voiceover: 'Migliaia di persone lo adorano gia.' },
    { time: '16-20s', visual: 'Prodotto e prezzo in evidenza, animazione del bottone Acquista ora', voiceover: 'Tutto questo ' + price + '. Approfittane ora!' },
  ]

  const cta = 'Tocca il link e ordina ' + product + ' prima che finisca!'
  const caption = product + ' sta diventando virale su ' + platform + '. Perfetto per ' + audience + '. Link in bio!'
  const hashtags = ['#fyp', '#perte', '#tiktokmademebuyit', '#dropshipping', '#offerta', '#trending', '#shopping']

  return { hook, scenes, cta, caption, hashtags, tone, platform }
}

async function aiScript(b: Body) {
  const system =
    'Sei un media buyer e copywriter esperto di video ads virali per dropshipping (TikTok, Reels, Shorts). Scrivi in italiano.'
  const prompt =
    'Crea lo script di un video ad di 20 secondi per il prodotto "' + (b.product || 'prodotto') + '". ' +
    'Pubblico: ' + (b.audience || 'pubblico ampio') + '. Tono: ' + (b.tone || 'energico') + '. ' +
    'Piattaforma: ' + (b.platform || 'TikTok') + '. ' +
    (b.price ? 'Prezzo: ' + b.price + ' euro. ' : '') +
    'Restituisci un JSON con: hook (stringa), scenes (array di 5 oggetti con time, visual, voiceover), ' +
    'cta (stringa), caption (stringa), hashtags (array di 7 hashtag con #).'
  const data = await generateJson(system, prompt)
  if (!data || !data.hook || !Array.isArray(data.scenes)) return null
  return {
    hook: data.hook,
    scenes: data.scenes,
    cta: data.cta || '',
    caption: data.caption || '',
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    tone: b.tone || 'energico',
    platform: b.platform || 'TikTok',
  }
}

async function hfImage(prompt: string): Promise<string | null> {
  if (!HF_TOKEN) return null
  try {
    const r = await fetch('https://api-inference.huggingface.co/models/' + IMAGE_MODEL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + HF_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    })
    if (!r.ok) return null
    const buf = Buffer.from(await r.arrayBuffer())
    return 'data:image/png;base64,' + buf.toString('base64')
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body
  const ai = aiConfigured() ? await aiScript(body) : null
  const script = ai || fallbackScript(body)
  const imagePrompt =
    'Professional advertising poster for ' +
    (body.product || 'product') +
    ', ' +
    (body.tone || 'modern') +
    ' style, studio lighting, vibrant colors, high detail, e-commerce hero shot, no text'
  const image = await hfImage(imagePrompt)
  return NextResponse.json({
    configured: Boolean(HF_TOKEN),
    aiText: Boolean(ai),
    provider: aiProvider(),
    note: ai
      ? 'Script generato con AI (' + aiProvider() + ').'
      : HF_TOKEN
      ? 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY per script scritti dall AI.'
      : 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY (testo) e HUGGINGFACE_API_TOKEN (immagine/video) in .env.local.',
    imagePrompt,
    image,
    script,
  })
}
