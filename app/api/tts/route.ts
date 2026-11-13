import { NextResponse, NextRequest } from 'next/server'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { synthesizeSpeech, ttsStatus } from '@/lib/tts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Voiceover gratuito per le ads.
//
// Il provider e' sostituibile (lib/tts.ts): di default si usa Google Translate,
// che non richiede chiavi, ma basta una env per passare a ElevenLabs, OpenAI o
// a un endpoint proprio. Se il provider scelto non risponde la catena passa al
// successivo e, se nessuno funziona, la route dice il motivo vero: il video
// viene esportato muto invece di rompersi.
//
// GET /api/tts?info=1  -> stato dei provider (nessuna chiamata esterna)
// GET /api/tts?text=...&lang=it -> audio/mpeg

const MAX_TOTAL = 600

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  if (searchParams.get('info') === '1') {
    return NextResponse.json(ttsStatus())
  }

  const limited = await rateLimitConfigs.default(req)
  if (limited) return limited

  const text = (searchParams.get('text') || '').trim()
  const lang =
    (searchParams.get('lang') || process.env.TTS_LANG || 'it').replace(/[^a-zA-Z-]/g, '').slice(0, 8) || 'it'

  if (!text) {
    return NextResponse.json(
      { error: 'Testo mancante per il voiceover. Usa ?text=... oppure ?info=1 per lo stato dei provider.' },
      { status: 400 }
    )
  }
  if (text.length > MAX_TOTAL) {
    return NextResponse.json(
      { error: 'Testo troppo lungo per il voiceover (massimo ' + MAX_TOTAL + ' caratteri).' },
      { status: 400 }
    )
  }

  const outcome = await synthesizeSpeech(text, lang)
  if (!outcome.ok) {
    return NextResponse.json(
      { error: 'Nessun provider voce ha risposto. ' + outcome.error },
      { status: 502 }
    )
  }

  // Copia in un Uint8Array con ArrayBuffer suo: e' quello che Next accetta come body.
  const body = new Uint8Array(outcome.result.audio.byteLength)
  body.set(outcome.result.audio)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': outcome.result.mime,
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'private, max-age=3600',
      'X-TTS-Provider': outcome.result.provider,
    },
  })
}
