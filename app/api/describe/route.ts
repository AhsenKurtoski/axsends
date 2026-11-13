import { NextResponse, NextRequest } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { validateBody, describeBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Descrizione prodotto generata dall'AI (Groq/OpenRouter/Gemini). Niente template.
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.ai(req)
  if (rateLimitResponse) return rateLimitResponse
  const validation = await validateBody(req, describeBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { product, name: alias, category, price, features, tone } = validation.data
  const name = (product || alias || '').trim()
  if (!name) {
    return NextResponse.json(
      { error: 'Specifica il nome del prodotto (campo "product" o "name").' },
      { status: 400 }
    )
  }
  const categoryLabel = category || 'lifestyle'

  if (!aiConfigured()) {
    return NextResponse.json(
      {
        error:
          'Nessuna AI configurata. Imposta GROQ_API_KEY, OPENROUTER_API_KEY o GEMINI_API_KEY in .env.local per generare descrizioni reali.',
      },
      { status: 503 }
    )
  }

  const system =
    'Sei un copywriter e-commerce senior specializzato in schede prodotto che convertono. ' +
    'Scrivi in italiano concreto e verificabile: benefici prima delle caratteristiche, linguaggio del cliente, zero superlativi vuoti. ' +
    'Non inventi certificazioni, recensioni, premi o dati di vendita. Tono richiesto: ' + (tone || 'energico') + '.'
  const prompt =
    'Crea la scheda prodotto per: "' + name + '". Categoria: ' + categoryLabel + '. ' +
    (features && features.length > 0 ? 'Caratteristiche principali: ' + features.join(', ') + '. ' : '') +
    (price ? 'Prezzo di vendita: ' + price + ' euro. ' : '') +
    'Restituisci un JSON con questi campi esatti: ' +
    'title (titolo SEO con la keyword principale, max 70 caratteri), ' +
    'description (60-110 parole: prima frase = beneficio principale, poi come funziona, poi per chi e, chiudi con una ragione per comprare ora), ' +
    'bullets (array di 4 benefici scritti come risultati per il cliente, non come specifiche), ' +
    'objections (array di 2 obiezioni reali con la risposta in una frase), ' +
    'tags (array di 6 parole chiave SEO minuscole).'

  const data = await generateJson(system, prompt, { maxTokens: 1200, budgetMs: 40_000 })
  if (!data || !data.description) {
    return NextResponse.json(
      {
        error:
          'L AI non ha restituito una descrizione valida. Riprova tra poco o controlla la chiave nella pagina Diagnostica.',
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Generato con AI (' + aiProvider() + ').',
    title: data.title || name,
    description: data.description,
    bullets: Array.isArray(data.bullets) ? data.bullets : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
  })
}
