import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// La generazione video AI gratuita (text-to-video) non e affidabile sull'API
// gratuita di Hugging Face. Qui generiamo invece dei FOTOGRAMMI AI dallo
// storyboard con un modello immagine (FLUX), che funziona sempre. L'utente li
// monta in un breve video verticale (es. con CapCut) aggiungendo voiceover e musica.

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''
const IMAGE_MODEL = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'

async function hfImage(prompt: string): Promise<string | null> {
  try {
    const r = await fetch('https://api-inference.huggingface.co/models/' + IMAGE_MODEL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + HF_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    })
    if (!r.ok) return null
    const buf = Buffer.from(await r.arrayBuffer())
    return 'data:image/png;base64,' + buf.toString('base64')
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  if (!HF_TOKEN) {
    return NextResponse.json(
      { error: 'Aggiungi HUGGINGFACE_API_TOKEN in .env.local per generare i fotogrammi AI.' },
      { status: 400 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as any
  const product = (body && body.product ? String(body.product) : '').trim()
  const base = (body && body.prompt ? String(body.prompt) : 'cinematic product advertisement, vibrant colors, 4k').trim()
  const scenes = body && Array.isArray(body.scenes) ? body.scenes : []

  const count = scenes.length > 0 ? Math.min(3, scenes.length) : 3
  const prompts: string[] = []
  for (let i = 0; i < count; i++) {
    const sc = scenes[i]
    let visual = ''
    if (sc && typeof sc === 'object') visual = String(sc.visual || sc.scene || '')
    const text = visual ? visual : base
    prompts.push(
      'Cinematic vertical advertising frame, ' + text + (product ? ', product: ' + product : '') +
        ', studio lighting, vibrant colors, ultra detailed, e-commerce hero shot, no text'
    )
  }

  const frames: string[] = []
  for (let i = 0; i < prompts.length; i++) {
    const img = await hfImage(prompts[i])
    if (img) frames.push(img)
  }

  if (frames.length === 0) {
    return NextResponse.json(
      {
        error:
          'Il generatore di immagini AI non ha risposto (il modello potrebbe essere in avvio su Hugging Face). Riprova tra 30 secondi.',
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    frames,
    note:
      'Generati ' + frames.length + ' fotogrammi AI dallo storyboard. Scaricali e montali in un video verticale di 15-20s con CapCut (gratis): aggiungi il voiceover dallo script e una musica trend. La generazione video AI gratuita non e affidabile, quindi il metodo a fotogrammi e piu veloce e funziona sempre.',
  })
}
