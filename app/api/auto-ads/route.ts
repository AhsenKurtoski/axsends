import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { MARKUP, scoreProduct } from '@/lib/products'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MIN_SCORE = 50

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

function toLines(v: any): string[] {
  if (Array.isArray(v)) return v.map(toText).filter(Boolean)
  const s = toText(v)
  return s ? [s] : []
}

function normTiktok(o: any) {
  if (!o || typeof o !== 'object') return null
  return { hook: toText(o.hook), caption: toText(o.caption), hashtags: toLines(o.hashtags), script: toLines(o.script) }
}

function normYoutube(o: any) {
  if (!o || typeof o !== 'object') return null
  return { title: toText(o.title), description: toText(o.description), tags: toLines(o.tags), script: toLines(o.script) }
}

// Genera automaticamente ads TikTok + YouTube per ogni prodotto con potenziale.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''
  const limit = Math.min(12, Math.max(1, parseInt(searchParams.get('limit') || '8', 10)))

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare ads automatiche con AI.',
      ads: [],
    })
  }

  const cj = await searchCjProducts({ keyword, pageSize: 40 })
  if (!cj.ok || cj.products.length === 0) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      cj: false,
      note:
        cj.error === 'no-credentials'
          ? 'Aggiungi CJ_EMAIL e CJ_API_KEY per trovare prodotti reali da promuovere.'
          : 'Nessun prodotto trovato da promuovere ora.',
      ads: [],
    })
  }

  const candidates = cj.products
    .map((p) => {
      const s = scoreProduct(p.cost, p.popularity)
      const price = Math.round(p.cost * MARKUP * 100) / 100
      return { id: p.id, name: p.name, image: p.image, category: p.category, cost: p.cost, price, score: s.score, label: s.label }
    })
    .filter((p) => p.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  if (candidates.length === 0) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      cj: true,
      note: 'Nessun prodotto ha superato la soglia di potenziale al momento.',
      ads: [],
    })
  }

  const system =
    'Sei un media buyer e copywriter esperto di video ads virali per dropshipping. Scrivi in italiano, orientato alla conversione.'
  const strictSuffix =
    ' IMPORTANTE: usa ESATTAMENTE queste chiavi. tiktok: hook, caption, hashtags (array di stringhe), script (array di stringhe brevi). ' +
    'youtube: title, description, tags (array di stringhe), script (array di stringhe brevi). ' +
    'Le scene dello script devono essere stringhe semplici, NON oggetti, e niente chiavi in italiano.'

  const ads = []
  for (const p of candidates) {
    const prompt =
      'Prodotto: "' + p.name + '" (categoria ' + p.category + ', prezzo di vendita ' + p.price + ' euro). ' +
      'Crea due video ad pronti da pubblicare. Restituisci un JSON con: ' +
      'tiktok (oggetto con hook, caption, hashtags array di 6, script array di 4 scene brevi come stringhe), ' +
      'youtube (oggetto con title, description, tags array di 6, script array di 4 scene brevi come stringhe).'
    let data = await generateJson(system, prompt)
    if (!data || (!data.tiktok && !data.youtube)) {
      data = await generateJson(system, prompt + strictSuffix)
    }
    ads.push({
      product: { id: p.id, name: p.name, image: p.image, price: p.price, score: p.score, label: p.label },
      tiktok: data && data.tiktok ? normTiktok(data.tiktok) : null,
      youtube: data && data.youtube ? normYoutube(data.youtube) : null,
      ok: Boolean(data && (data.tiktok || data.youtube)),
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    cj: true,
    count: ads.length,
    note: 'Ads generate automaticamente con AI (' + aiProvider() + ') per i prodotti con potenziale.',
    ads,
  })
}
