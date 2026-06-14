import { NextResponse } from 'next/server'
import { aiStatus, generateText } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

// Verifica dal vivo che le chiavi AI funzionino davvero.
export async function GET() {
  const status = aiStatus()
  let test: boolean | null = null
  if (status.active !== 'none') {
    const r = await generateText('Rispondi solo con la parola OK.', 'Scrivi: OK')
    test = Boolean(r)
  }
  return NextResponse.json({
    groq: status.groq,
    openrouter: status.openrouter,
    gemini: status.gemini,
    active: status.active,
    test,
  })
}
