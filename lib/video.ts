// Generazione video AI GRATUITA, senza carta di credito.
//
// Provider: Hugging Face Spaces con ZeroGPU. Un account gratuito ha 5 minuti
// di GPU al giorno (nessuna carta richiesta) e ogni Space Gradio espone una
// API HTTP: qui usiamo Wan 2.2 I2V, che anima un fotogramma generato dall'AI.
// Il flusso completo e':
//   1. immagine prodotto (Pollinations, gratis e senza chiave)
//   2. animazione immagine -> video MP4 (Wan 2.2 su ZeroGPU)
//
// Se lo Space e' in coda, spento o la quota giornaliera e' finita, la funzione
// ritorna null e il chiamante usa i fotogrammi come fallback: l'utente riceve
// comunque materiale utilizzabile.
//
// HF_VIDEO_SPACE permette di cambiare Space senza toccare il codice. Imposta
// HF_VIDEO_SPACE=off per disattivare del tutto la generazione video.

const DEFAULT_SPACE = 'prithivmlmods/Wan2.2-Fast'

function spaceId(): string {
  const raw = (process.env.HF_VIDEO_SPACE || DEFAULT_SPACE).trim()
  if (!raw || raw.toLowerCase() === 'off') return ''
  return raw
}

function spaceHost(id: string): string {
  // La sottodominio di uno Space e' owner-space con i punti sostituiti da -.
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.hf.space'
}

export function videoConfigured(): boolean {
  return Boolean(spaceId())
}

export function videoModelLabel(): string {
  const id = spaceId()
  return id ? 'Wan 2.2 I2V su Hugging Face ZeroGPU (' + id + ')' : 'disattivato (HF_VIDEO_SPACE=off)'
}

function hfToken(): string {
  return (process.env.HUGGINGFACE_API_TOKEN || '').trim()
}

function authHeader(): Record<string, string> {
  const token = hfToken()
  return token ? { Authorization: 'Bearer ' + token } : {}
}

type GradioPayload = { video?: string; seed?: number }

function extractVideo(payload: any): string | null {
  if (!payload) return null
  if (typeof payload === 'string' && payload.indexOf('data:video') === 0) return payload
  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      const found = extractVideo(payload[i])
      if (found) return found
    }
    return null
  }
  if (typeof payload === 'object') {
    if (typeof payload.video === 'string' && payload.video.indexOf('data:video') === 0) return payload.video
    if (typeof payload.url === 'string' && /\.mp4(\?|$)/i.test(payload.url)) return payload.url
  }
  return null
}

// Legge il flusso SSE di Gradio e restituisce l'ultimo evento "complete".
function parseSseVideo(body: string): string | null {
  const lines = body.split('\n')
  let last = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.indexOf('data:') === 0) last = line.slice(5).trim()
  }
  if (!last) return null
  try {
    return extractVideo(JSON.parse(last))
  } catch {
    return extractVideo(last)
  }
}

export type AnimateResult =
  | { ok: true; video: string; model: string }
  | { ok: false; error: string; model: string }

// Anima una singola immagine in un breve video verticale.
// imageDataUrl: data URL dell'immagine di partenza (Pollinations o HF).
export async function animateImage(
  imageDataUrl: string,
  prompt: string,
  opts?: { durationSeconds?: number; timeoutMs?: number; steps?: number }
): Promise<AnimateResult> {
  const id = spaceId()
  const model = id || DEFAULT_SPACE
  if (!id) return { ok: false, error: 'Generazione video disattivata (HF_VIDEO_SPACE=off).', model }
  if (!imageDataUrl) return { ok: false, error: 'Serve un immagine di partenza.', model }

  const host = spaceHost(id)
  const duration = Math.min(5, Math.max(2, opts && opts.durationSeconds ? opts.durationSeconds : 3))
  const steps = Math.min(8, Math.max(2, opts && opts.steps ? opts.steps : 4))
  const timeout = opts && opts.timeoutMs ? opts.timeoutMs : 150_000

  try {
    const start = await fetch('https://' + host + '/gradio_api/call/generate_video', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
      body: JSON.stringify({
        data: [
          imageDataUrl,
          prompt,
          steps,
          'blurry, static, distorted, deformed, text, watermark, low quality',
          duration,
          1.0,
          1.0,
          Math.floor(Math.random() * 2_000_000_000),
          false,
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!start.ok) {
      return { ok: false, error: 'Lo Space video non ha accettato la richiesta (HTTP ' + start.status + ').', model }
    }
    const started: any = await start.json().catch(() => null)
    const eventId = started && started.event_id
    if (!eventId) return { ok: false, error: 'Nessun event_id ricevuto dallo Space video.', model }

    const stream = await fetch('https://' + host + '/gradio_api/call/generate_video/' + eventId, {
      headers: Object.assign({ Accept: 'text/event-stream' }, authHeader()),
      signal: AbortSignal.timeout(timeout),
    })
    if (!stream.ok) {
      return { ok: false, error: 'Errore dallo Space video (HTTP ' + stream.status + ').', model }
    }
    const video = parseSseVideo(await stream.text())
    if (!video) {
      return { ok: false, error: 'Lo Space video non ha restituito un MP4 (coda piena o quota GPU finita).', model }
    }
    return { ok: true, video, model }
  } catch (e: any) {
    const reason = e && e.name === 'TimeoutError' ? 'tempo scaduto' : String(e && e.message ? e.message : e)
    return { ok: false, error: 'Generazione video non riuscita: ' + reason.slice(0, 140), model }
  }
}

// Verifica veloce che lo Space sia raggiungibile e che esponga l'endpoint.
export async function probeVideoSpace(): Promise<{ ok: boolean; message: string }> {
  const id = spaceId()
  if (!id) return { ok: false, message: 'Generazione video disattivata (HF_VIDEO_SPACE=off).' }
  try {
    const r = await fetch('https://' + spaceHost(id) + '/gradio_api/info', {
      headers: authHeader(),
      signal: AbortSignal.timeout(15_000),
    })
    if (!r.ok) return { ok: false, message: 'Space non raggiungibile (HTTP ' + r.status + ').' }
    const j: any = await r.json().catch(() => null)
    const endpoints = j && j.named_endpoints ? Object.keys(j.named_endpoints) : []
    if (endpoints.indexOf('/generate_video') < 0) {
      return { ok: false, message: 'Space raggiungibile ma senza endpoint /generate_video.' }
    }
    return {
      ok: true,
      message: 'Pronto: ' + id + '. Gratis con Hugging Face ZeroGPU (5 minuti di GPU al giorno, nessuna carta).',
    }
  } catch (e: any) {
    return { ok: false, message: 'Errore di rete verso lo Space: ' + String(e && e.message ? e.message : e).slice(0, 120) }
  }
}
