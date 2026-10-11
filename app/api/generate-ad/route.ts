import { NextResponse, NextRequest } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { validateBody, generateAdBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''
const IMAGE_MODEL = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'

type Body = {
  product?: string
  audience?: string
  tone?: string
  platform?: string
  price?: string | number
}

// Coercizione sicura a stringa, qualunque forma abbia il valore dell AI.
function toText(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(' ')
  if (typeof v === 'object') {
    const keys = ['visual', 'scene', 'scena', 'text', 'description', 'descrizione', 'value']
    for (let i = 0; i < keys.length; i++) {
      if (typeof v[keys[i]] === 'string') return v[keys[i]]
    }
    return Object.keys(v).map((k) => toText(v[k])).filter(Boolean).join(' ')
  }
  return String(v)
}

// Normalizza le scene in oggetti puliti { time, visual, voiceover } come stringhe,
// indipendentemente dalle chiavi usate dall AI (scene, scena, visivo, voce, ecc.).
function normalizeScenes(arr: any): Array<{ time: string; visual: string; voiceover: string }> {
  if (!Array.isArray(arr)) return []
  return arr.map((s: any, i: number) => {
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const time = toText(s.time || s.tempo || s.timing) || ('0-' + ((i + 1) * 4) + 's')
      let visual = toText(s.visual || s.visivo || s.scene || s.scena || s.description || s.descrizione || s.azione)
      const voiceover = toText(s.voiceover || s.voce || s.voiceOver || s.audio || s.speech || s.narration)
      if (!visual) visual = toText(s)
      return { time, visual, voiceover }
    }
    return { time: '0-' + ((i + 1) * 4) + 's', visual: toText(s), voiceover: '' }
  })
}

function fallbackScript(b: Body) {
  const product = (b.product || 'il tuo prodotto').trim()
  const audience = (b.audience || 'chi cerca qualcosa di nuovo').trim()
  const tone = b.tone || 'energico'
  const platform = b.platform || 'TikTok'
  const price = b.price ? 'solo ' + b.price + '\u20ac' : 'a un prezzo speciale'

  const hook = 'POV: hai appena scoperto ' + product + ' e non potrai piu farne a meno'

  const variants = [
    'Non comprare altro finche non vedi ' + product,
    '3 motivi per cui ' + product + ' sta diventando virale',
    'Ho provato ' + product + ' per 7 giorni: ecco cosa e successo',
  ]

  const scenes = [
    { time: '0-2s', visual: 'Primo piano dinamico di ' + product + ' con luci al neon e zoom rapido', voiceover: 'Stop! Se sei ' + audience + ', guarda qui.' },
    { time: '2-6s', visual: 'Mostra il problema quotidiano che ' + product + ' risolve, taglio veloce', voiceover: 'Basta perdere tempo con soluzioni che non funzionano.' },
    { time: '6-12s', visual: 'Demo del prodotto in uso, testo a schermo con i 3 benefici principali', voiceover: product + ' e facile, veloce e ti cambia la giornata.' },
    { time: '12-16s', visual: 'Recensioni a 5 stelle che scorrono e badge spedizione veloce', voiceover: 'Migliaia di persone lo adorano gia.' },
    { time: '16-20s', visual: 'Prodotto e prezzo in evidenza, animazione del bottone Acquista ora', voiceover: 'Tutto questo ' + price + '. Approfittane ora!' },
  ]

  const cta = 'Tocca il link e ordina ' + product + ' prima che finisca!'
  const caption = product + ' sta diventando virale su ' + platform + '. Perfetto per ' + audience + '. Link in bio!'
  const hashtags = ['#fyp', '#perte', '#tiktokmademebuyit', '#dropshipping', '#offerta', '#trending', '#shopping', '#viral']
  const targeting = 'Pubblico consigliato: ' + audience + '. Eta 18-45, dispositivi mobile, interessi collegati alla categoria del prodotto.'

  return { hook, variants, scenes, cta, caption, hashtags, targeting, tone, platform }
}

async function tryScript(b: Body, strict: boolean) {
  const system =
    'Sei un direttore creativo e media buyer premium per video ads di e-commerce e dropshipping ad alta conversione (TikTok, Reels, Facebook, YouTube Shorts). Scrivi in italiano con copy professionale, moderno e persuasivo: hook fortissimo nei primi 2 secondi, dimostrazione chiara del valore, prova sociale e una CTA diretta.'
  let prompt =
    'Crea uno script PREMIUM di un video ad di 20 secondi per il prodotto "' + (b.product || 'prodotto') + '". ' +
    'Pubblico: ' + (b.audience || 'pubblico ampio') + '. Tono: ' + (b.tone || 'energico') + '. ' +
    'Piattaforma: ' + (b.platform || 'TikTok') + '. ' +
    (b.price ? 'Prezzo: ' + b.price + ' euro. ' : '') +
    'Restituisci un JSON con: hook (stringa), variants (array di 3 hook alternativi per A/B test), ' +
    'scenes (array di 5 oggetti con time, visual, voiceover), cta (stringa), caption (stringa), ' +
    'hashtags (array di 8 hashtag con #), targeting (stringa con suggerimento di pubblico e interessi).'
  if (strict) {
    prompt +=
      ' IMPORTANTE: usa ESATTAMENTE queste chiavi in inglese. Alla radice: hook, variants, scenes, cta, caption, hashtags, targeting. ' +
      'Ogni elemento di scenes deve avere SOLO le tre chiavi time, visual e voiceover, tutte con valore stringa. ' +
      'NON usare chiavi in italiano come scena, visivo o voce, e non annidare oggetti dentro le scene.'
  }
  const data = await generateJson(system, prompt)
  if (!data || !data.hook || !Array.isArray(data.scenes)) return null
  return {
    hook: toText(data.hook),
    variants: Array.isArray(data.variants) ? data.variants.map(toText).filter(Boolean) : [],
    scenes: normalizeScenes(data.scenes),
    cta: toText(data.cta),
    caption: toText(data.caption),
    hashtags: Array.isArray(data.hashtags) ? data.hashtags.map(toText).filter(Boolean) : [],
    targeting: toText(data.targeting),
    tone: b.tone || 'energico',
    platform: b.platform || 'TikTok',
  }
}

// L AI a volte sbaglia formato: se il primo tentativo fallisce, riprova con un
// prompt piu rigido (auto-correzione del prompt).
async function aiScript(b: Body) {
  const first = await tryScript(b, false)
  if (first) return first
  return await tryScript(b, true)
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

export async function POST(req: NextRequest) {
  // Rate limiting per API AI
  const rateLimitResponse = await rateLimitConfigs.ai(req)
  if (rateLimitResponse) return rateLimitResponse

  const validation = await validateBody(req, generateAdBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const body = validation.data
  const ai = aiConfigured() ? await aiScript(body) : null
  const script = ai || fallbackScript(body)
  const imagePrompt =
    'Premium professional advertising poster for ' +
    (body.product || 'product') +
    ', ' +
    (body.tone || 'modern') +
    ' style, studio lighting, cinematic, vibrant colors, ultra detailed, e-commerce hero shot, no text'
  const image = await hfImage(imagePrompt)
  return NextResponse.json({
    configured: Boolean(HF_TOKEN),
    aiText: Boolean(ai),
    provider: aiProvider(),
    note: ai
      ? 'Script premium generato con AI (' + aiProvider() + ').'
      : HF_TOKEN
      ? 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY per script scritti dall AI.'
      : 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY (testo) e HUGGINGFACE_API_TOKEN (immagine) in .env.local.',
    imagePrompt,
    image,
    script,
  })
}
