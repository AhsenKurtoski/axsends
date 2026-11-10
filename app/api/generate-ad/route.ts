import { NextResponse, NextRequest } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { validateBody, generateAdBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { generateImage, hfConfigured } from '@/lib/hf'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

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
  const script = await aiScript(body)
  if (!script) {
    return NextResponse.json(
      {
        error:
          'L AI non ha restituito uno script valido. Riprova tra poco o controlla la chiave nella pagina Diagnostica.',
      },
      { status: 502 }
    )
  }

  const imagePrompt =
    'Premium professional advertising poster for ' +
    (body.product || 'product') +
    ', ' +
    (body.tone || 'modern') +
    ' style, studio lighting, cinematic, vibrant colors, ultra detailed, e-commerce hero shot, no text'
  const image = await generateImage(imagePrompt)

  return NextResponse.json({
    aiText: true,
    provider: aiProvider(),
    imageConfigured: hfConfigured(),
    note: image
      ? 'Script e immagine generati con AI (' + aiProvider() + ' + Hugging Face).'
      : hfConfigured()
        ? 'Script generato con AI (' + aiProvider() + '). Immagine non disponibile: Hugging Face non ha risposto.'
        : 'Script generato con AI (' + aiProvider() + '). Aggiungi HUGGINGFACE_API_TOKEN per generare anche l immagine.',
    imagePrompt,
    image,
    script,
  })
}
