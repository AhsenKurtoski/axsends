import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { MARKUP, scoreProduct } from '@/lib/products'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MIN_SCORE = 55

// Genera automaticamente ads TikTok + YouTube per ogni prodotto con potenziale.
// Nessun prompt richiesto: trova i prodotti, li filtra per punteggio, scrive le ads con AI.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''
  const limit = Math.min(8, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)))

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare ads automatiche con AI.',
      ads: [],
    })
  }

  const cj = await searchCjProducts({ keyword, pageSize: 20 })
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

  const ads = []
  for (const p of candidates) {
    const prompt =
      'Prodotto: "' + p.name + '" (categoria ' + p.category + ', prezzo di vendita ' + p.price + ' euro). ' +
      'Crea due video ad pronti da pubblicare. Restituisci un JSON con: ' +
      'tiktok (oggetto con hook, caption, hashtags array di 6, script array di 4 scene brevi), ' +
      'youtube (oggetto con title, description, tags array di 6, script array di 4 scene brevi).'
    const data = await generateJson(system, prompt)
    ads.push({
      product: { id: p.id, name: p.name, image: p.image, price: p.price, score: p.score, label: p.label },
      tiktok: data && data.tiktok ? data.tiktok : null,
      youtube: data && data.youtube ? data.youtube : null,
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
