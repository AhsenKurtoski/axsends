import { NextResponse } from 'next/server'
import { aiStatus, generateText } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Verifica dal vivo che le chiavi AI funzionino davvero.
export async function GET() {
  const status = aiStatus()
  let test: boolean | null = null
  if (status.active !== 'none') {
    const r = await generateText('Rispondi solo con la parola OK.', 'Scrivi: OK', 16, { budgetMs: 20_000 })
    test = Boolean(r)
  }
  return NextResponse.json({
    groq: status.groq,
    openrouter: status.openrouter,
    gemini: status.gemini,
    groqKeys: status.groqKeys,
    openrouterKeys: status.openrouterKeys,
    geminiKeys: status.geminiKeys,
    active: status.active,
    test,
  })
}
