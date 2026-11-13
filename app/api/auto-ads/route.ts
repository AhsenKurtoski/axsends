import { NextResponse, NextRequest } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { MARKUP, scoreProduct } from '@/lib/products'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { adSystemPrompt, adPrompt, adStrictSuffix, buildAdScript } from '@/lib/adkit'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MIN_SCORE = 40

// Ads automatiche: trova i prodotti con potenziale su CJ e scrive per ognuno
// un pacchetto TikTok + YouTube completo (hashtag, descrizione, sottotitoli).
export async function GET(req: NextRequest) {
  const limited = await rateLimitConfigs.search(req)
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') || ''
  const limit = Math.min(8, Math.max(1, parseInt(searchParams.get('limit') || '6', 10) || 6))

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

  const ads = []
  for (const p of candidates) {
    const request = {
      product: p.name,
      audience: p.category,
      tone: 'energico',
      platform: 'TikTok',
      price: p.price,
    }
    let data = await generateJson(adSystemPrompt(), adPrompt(request), { maxTokens: 1600, budgetMs: 45_000 })
    if (!data || !data.hook || !Array.isArray(data.scenes)) {
      data = await generateJson(adSystemPrompt(), adPrompt(request) + adStrictSuffix, {
        maxTokens: 1600,
        budgetMs: 45_000,
      })
    }
    const script = buildAdScript(data, request)

    ads.push({
      product: { id: p.id, name: p.name, image: p.image, price: p.price, score: p.score, label: p.label },
      tiktok: script
        ? {
            hook: script.hook,
            caption: script.caption,
            hashtags: script.hashtags,
            captionWithTags: (script.caption + '\n\n' + script.hashtags.join(' ')).trim(),
            script: script.scenes.map((s) => s.time + ' - ' + s.visual + ' | ' + s.voiceover),
          }
        : null,
      youtube: script
        ? {
            title: script.title || script.hook,
            description: script.description,
            tags: script.keywords,
            descriptionWithTags: (script.description + '\n\n' + script.hashtags.join(' ')).trim(),
            script: script.scenes.map((s) => s.time + ' - ' + s.visual + ' | ' + s.voiceover),
          }
        : null,
      subtitles: script ? { srt: script.subtitles.srt, vtt: script.subtitles.vtt } : null,
      ok: Boolean(script),
    })
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    cj: true,
    count: ads.length,
    note: 'Ads generate con AI (' + aiProvider() + ') per i prodotti con potenziale, sottotitoli inclusi.',
    ads,
  })
}
