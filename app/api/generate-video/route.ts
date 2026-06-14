import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''
const VIDEO_MODEL = process.env.HF_VIDEO_MODEL || 'Wan-AI/Wan2.1-T2V-1.3B'

export async function POST(req: Request) {
  if (!HF_TOKEN) {
    return NextResponse.json(
      { error: 'Aggiungi HUGGINGFACE_API_TOKEN in .env.local per generare il video AI.' },
      { status: 400 }
    )
  }
  const body = await req.json().catch(() => ({}))
  const prompt =
    (body && body.prompt) ||
    'cinematic product advertisement, dynamic camera movement, 4k, vibrant colors'
  try {
    const r = await fetch('https://api-inference.huggingface.co/models/' + VIDEO_MODEL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + HF_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    })
    if (!r.ok) {
      const detail = await r.text()
      return NextResponse.json(
        {
          error:
            'Modello video non ancora disponibile (status ' +
            r.status +
            '). Riprova tra poco oppure cambia HF_VIDEO_MODEL nel file .env.local.',
          detail: detail.slice(0, 300),
        },
        { status: 502 }
      )
    }
    const type = r.headers.get('content-type') || 'video/mp4'
    const buf = Buffer.from(await r.arrayBuffer())
    return NextResponse.json({ video: 'data:' + type + ';base64,' + buf.toString('base64') })
  } catch (e) {
    return NextResponse.json(
      { error: 'Errore nella generazione del video', detail: String(e) },
      { status: 500 }
    )
  }
}
