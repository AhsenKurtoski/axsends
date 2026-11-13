import { NextResponse, NextRequest } from 'next/server'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Voiceover gratuito per le ads: legge il testo del cue con la voce di Google
// Translate (endpoint pubblico, nessuna chiave e nessuna carta). Il file torna
// come audio/mpeg e il renderer lo mixa sul video alla battuta giusta.
//
// Nota onesta: e' un endpoint non ufficiale, quindi puo' cambiare o fermarsi.
// Se non risponde la route dice il motivo vero e il video viene esportato muto.

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// L'endpoint accetta circa 200 caratteri: spezzo il testo per stare larghi.
const MAX_CHUNK = 180
const MAX_TOTAL = 600

function chunkText(text: string, size = MAX_CHUNK): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]

  const words = clean.split(' ')
  const chunks: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? current + ' ' + word : word
    if (next.length <= size) {
      current = next
      continue
    }
    if (current) chunks.push(current)
    current = word
  }
  if (current) chunks.push(current)
  return chunks
}

export async function GET(req: NextRequest) {
  const limited = await rateLimitConfigs.default(req)
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const text = (searchParams.get('text') || '').trim()
  const lang =
    (searchParams.get('lang') || process.env.TTS_LANG || 'it').replace(/[^a-zA-Z-]/g, '').slice(0, 8) || 'it'

  if (!text) {
    return NextResponse.json({ error: 'Testo mancante per il voiceover.' }, { status: 400 })
  }
  if (text.length > MAX_TOTAL) {
    return NextResponse.json(
      { error: 'Testo troppo lungo per il voiceover (massimo ' + MAX_TOTAL + ' caratteri).' },
      { status: 400 }
    )
  }

  const pieces = chunkText(text)
  if (pieces.length === 0) {
    return NextResponse.json({ error: 'Nessun testo da leggere.' }, { status: 400 })
  }

  const buffers: Buffer[] = []
  for (const piece of pieces) {
    const url =
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' +
      encodeURIComponent(lang) +
      '&q=' +
      encodeURIComponent(piece)

    let response: Response
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Referer: 'https://translate.google.com/' },
        signal: AbortSignal.timeout(15_000),
        cache: 'no-store',
      })
    } catch (e) {
      return NextResponse.json(
        { error: 'Servizio voce non raggiungibile: ' + String(e).slice(0, 100) },
        { status: 502 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Servizio voce ha risposto ' + response.status + '. Riprova tra poco.' },
        { status: 502 }
      )
    }

    const type = response.headers.get('content-type') || ''
    if (!type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Il servizio voce ha risposto con un formato inatteso.' }, { status: 502 })
    }

    const body = Buffer.from(await response.arrayBuffer())
    if (body.length < 1000) {
      return NextResponse.json({ error: 'Il servizio voce ha restituito un audio vuoto.' }, { status: 502 })
    }
    buffers.push(body)
  }

  const audio = Buffer.concat(buffers)
  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audio.length),
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
