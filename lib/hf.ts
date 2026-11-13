// Generazione immagini per le ads.
//
// Primo provider: Pollinations (https://image.pollinations.ai). E' gratuito,
// non richiede chiave ne' carta di credito e risponde in pochi secondi, quindi
// le creativita' si generano sempre. Secondo provider: Hugging Face, se il
// token e un modello sono disponibili (l'API gratuita ha ritirato molti
// modelli: FLUX.1-schnell oggi risponde 410, per questo e' solo un fallback).
//
// Nessuna immagine finta: se nessun provider risponde, ritorna null.

const HF_TOKEN = (process.env.HUGGINGFACE_API_TOKEN || '').trim()
const IMAGE_MODEL = (process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell').trim()

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt/'

// Il piano gratuito di Pollinations serve UNA immagine ogni 45 secondi per IP.
// Senza pacing le richieste ravvicinate prendono 402 FREE_LIMIT: qui le mettiamo
// in fila e le distanziamo, cosi le creativita' si generano sempre.
const POLLINATIONS_TOKEN = (process.env.POLLINATIONS_TOKEN || '').trim()
const MIN_INTERVAL_MS = POLLINATIONS_TOKEN
  ? 0
  : Math.min(60_000, Math.max(0, Number(process.env.POLLINATIONS_MIN_INTERVAL_MS || 45_500)))

let lastPollinationsAt = 0
let queue: Promise<unknown> = Promise.resolve()
let lastImageFailure = ''

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Una sola richiesta alla volta: il limite e' per IP, non per richiesta.
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

// Motivo reale dell'ultimo fallimento, da mostrare all'utente.
export function imageFailureReason(): string {
  return lastImageFailure
}

export function hfConfigured(): boolean {
  // Le immagini funzionano anche senza Hugging Face: il provider primario non
  // richiede chiavi. Questa funzione resta per compatibilita' con la diagnostica.
  return true
}

export function hfImageModel(): string {
  return HF_TOKEN ? 'Pollinations + ' + IMAGE_MODEL + ' (HF)' : 'Pollinations (gratis, senza chiave)'
}

export function imageProviderLabel(): string {
  return 'Pollinations'
}

function dataUrl(type: string, buf: Buffer): string {
  return 'data:' + type.split(';')[0] + ';base64,' + buf.toString('base64')
}

async function fromPollinations(prompt: string, width: number, height: number, seed: number): Promise<string | null> {
  const url =
    POLLINATIONS_BASE +
    encodeURIComponent(prompt) +
    '?width=' +
    width +
    '&height=' +
    height +
    '&nologo=true&seed=' +
    seed +
    '&model=flux'

  for (let attempt = 1; attempt <= 2; attempt++) {
    // Distanzia le richieste per rispettare il limite gratuito.
    if (MIN_INTERVAL_MS > 0) {
      const wait = lastPollinationsAt + MIN_INTERVAL_MS - Date.now()
      if (wait > 0) await sleep(wait)
    }
    lastPollinationsAt = Date.now()

    let r: Response
    try {
      r = await fetch(url, {
        headers: POLLINATIONS_TOKEN ? { Authorization: 'Bearer ' + POLLINATIONS_TOKEN } : undefined,
        signal: AbortSignal.timeout(60_000),
      })
    } catch (e) {
      lastImageFailure = 'rete non raggiungibile (' + String(e).slice(0, 60) + ')'
      continue
    }

    if (r.status === 402) {
      // Il server dice quanti secondi aspettare prima di riprovare.
      const body = await r.text().catch(() => '')
      const retry = body.match(/retry after (\d+)\s*s/i) || body.match(/(\d+)\s*s/i)
      const waitMs = retry ? Math.min(Number(retry[1]) * 1000 + 1500, 60_000) : MIN_INTERVAL_MS
      lastImageFailure = 'quota gratuita raggiunta (1 immagine ogni 45 secondi)'
      if (attempt < 2) {
        await sleep(waitMs)
        // Ho gia' aspettato il tempo indicato dal server: azzero l'attesa del
        // ciclo, altrimenti al giro successivo aspetterei altri 45 secondi.
        lastPollinationsAt = Date.now() - MIN_INTERVAL_MS
        continue
      }
      return null
    }

    if (!r.ok) {
      lastImageFailure = 'il servizio immagini ha risposto HTTP ' + r.status
      return null
    }

    const type = r.headers.get('content-type') || ''
    if (type.indexOf('image/') !== 0) {
      lastImageFailure = 'il servizio immagini ha risposto con un formato inatteso'
      return null
    }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length < 1000) {
      lastImageFailure = 'immagine vuota'
      return null
    }
    lastImageFailure = ''
    return dataUrl(type, buf)
  }
  return null
}

async function fromHuggingFace(prompt: string): Promise<string | null> {
  if (!HF_TOKEN) return null
  const endpoints = [
    'https://router.huggingface.co/hf-inference/models/' + IMAGE_MODEL,
    'https://api-inference.huggingface.co/models/' + IMAGE_MODEL,
  ]
  for (let i = 0; i < endpoints.length; i++) {
    try {
      const r = await fetch(endpoints[i], {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + HF_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt }),
        signal: AbortSignal.timeout(45_000),
      })
      if (!r.ok) continue
      // Hugging Face a volte risponde 200 con un JSON di errore: accettiamo
      // solo risposte che sono davvero un'immagine.
      const type = r.headers.get('content-type') || ''
      if (type.indexOf('image/') !== 0) continue
      const buf = Buffer.from(await r.arrayBuffer())
      return dataUrl(type, buf)
    } catch {
      // provo l'endpoint successivo
    }
  }
  return null
}

// Genera un'immagine e la restituisce come data URL pronta da mostrare.
// opts.width/height: per le ads verticali conviene 768x1344 (9:16).
export async function generateImage(
  prompt: string,
  opts?: { width?: number; height?: number; seed?: number }
): Promise<string | null> {
  const width = opts && opts.width ? opts.width : 768
  const height = opts && opts.height ? opts.height : 1344
  const seed = opts && opts.seed ? opts.seed : Math.floor(Math.random() * 1_000_000)

  try {
    const img = await enqueue(() => fromPollinations(prompt, width, height, seed))
    if (img) return img
  } catch {
    // passo al provider successivo
  }

  try {
    return await fromHuggingFace(prompt)
  } catch {
    return null
  }
}
