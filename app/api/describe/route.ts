import { NextResponse, NextRequest } from 'next/server'
import { generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { validateBody, describeBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Descrizione prodotto generata dall'AI (Groq/Gemini). Niente template.
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.ai(req)
  if (rateLimitResponse) return rateLimitResponse
  const validation = await validateBody(req, describeBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { product: name, features, tone } = validation.data
  const category = 'lifestyle'
  const price = null

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi GROQ_API_KEY o GEMINI_API_KEY in .env.local per generare descrizioni reali con AI.',
      title: null,
      description: null,
      bullets: [],
      tags: [],
    })
  }

  const system =
    'Sei un copywriter e-commerce esperto di dropshipping. Scrivi in italiano, persuasivo ma onesto, ottimizzato per conversione e SEO. Tono: ' + (tone || 'energico') + '.'
  const prompt =
    'Crea la scheda prodotto per: "' + name + '". Categoria: ' + category + '. ' +
    (features && features.length > 0 ? 'Caratteristiche principali: ' + features.join(', ') + '. ' : '') +
    (price ? 'Prezzo di vendita: ' + price + ' euro. ' : '') +
    'Restituisci un JSON con questi campi esatti: title (titolo SEO accattivante, max 70 caratteri), ' +
    'description (60-110 parole), bullets (array di 4 benefici), tags (array di 6 parole chiave SEO minuscole).'

  const data = await generateJson(system, prompt)
  if (!data || !data.description) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
      title: null,
      description: null,
      bullets: [],
      tags: [],
    })
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
