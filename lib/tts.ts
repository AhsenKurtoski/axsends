// Voiceover delle ads con provider sostituibile.
//
// Il progetto non deve dipendere da un singolo servizio: qui c'e' una catena di
// provider, ognuno attivabile con una chiave o una URL. Se il primo non
// risponde si passa al successivo, e l'ultimo (Google Translate) funziona senza
// chiave, cosi il pacchetto ads continua a funzionare su un'installazione nuova.
//
// Configurazione (vedi README):
//   TTS_PROVIDER=auto|google|elevenlabs|openai|custom
//   TTS_FALLBACK=1|0
//   ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL
//   OPENAI_API_KEY, OPENAI_BASE_URL, TTS_MODEL, TTS_VOICE
//   TTS_CUSTOM_URL (con {text} e {lang}), TTS_CUSTOM_API_KEY, TTS_LANG

export type TtsProviderId = 'google' | 'elevenlabs' | 'openai' | 'custom'

export type TtsProviderMeta = { id: TtsProviderId; label: string; configured: boolean }

export type TtsAudio = { audio: Uint8Array; mime: string; provider: TtsProviderId }

function concatAudio(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const joined = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    joined.set(part, offset)
    offset += part.length
  }
  return joined
}

export type TtsOutcome = { ok: true; result: TtsAudio } | { ok: false; error: string }

type Env = Record<string, string | undefined>

const GOOGLE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// L'endpoint Google accetta circa 200 caratteri per richiesta.
const GOOGLE_MAX_CHUNK = 180

const PROVIDER_IDS: TtsProviderId[] = ['custom', 'elevenlabs', 'openai', 'google']

const LABELS: Record<TtsProviderId, string> = {
  custom: 'Endpoint personalizzato',
  elevenlabs: 'ElevenLabs',
  openai: 'OpenAI',
  google: 'Google Translate (senza chiave)',
}

export function isTtsProviderId(value: string): value is TtsProviderId {
  return (PROVIDER_IDS as string[]).indexOf(value) >= 0
}

function isConfigured(id: TtsProviderId, env: Env): boolean {
  if (id === 'custom') return Boolean(env.TTS_CUSTOM_URL)
  if (id === 'elevenlabs') return Boolean(env.ELEVENLABS_API_KEY)
  if (id === 'openai') return Boolean(env.OPENAI_API_KEY)
  return true // Google non richiede chiavi
}

// Elenco dei provider con lo stato di configurazione, per la diagnostica.
export function ttsProviders(env: Env = process.env): TtsProviderMeta[] {
  return PROVIDER_IDS.map((id) => ({ id, label: LABELS[id], configured: isConfigured(id, env) }))
}

// Ordine in cui provare i provider. Google e' sempre in coda: senza chiavi
// l'app funziona comunque, con una chiave configurata quella passa avanti.
export function ttsProviderOrder(env: Env = process.env): TtsProviderId[] {
  const available = PROVIDER_IDS.filter((id) => isConfigured(id, env))
  const requested = (env.TTS_PROVIDER || 'auto').trim().toLowerCase()
  const fallback = env.TTS_FALLBACK !== '0'

  if (requested === '' || requested === 'auto' || !isTtsProviderId(requested)) {
    // Prima i provider con chiave, Google come rete di sicurezza.
    return available
  }

  const ordered = [requested as TtsProviderId, ...available.filter((id) => id !== requested)]
  return fallback ? ordered : [requested as TtsProviderId]
}

function splitForGoogle(text: string, size = GOOGLE_MAX_CHUNK): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]

  const chunks: string[] = []
  let current = ''
  for (const word of clean.split(' ')) {
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

async function readAudio(response: Response, provider: TtsProviderId): Promise<TtsAudio> {
  const type = response.headers.get('content-type') || ''
  if (type.indexOf('audio/') !== 0) {
    throw new Error('risposta non audio (' + (type || 'senza content-type') + ')')
  }
  const audio = new Uint8Array(await response.arrayBuffer())
  if (audio.length < 1000) throw new Error('audio vuoto')
  return { audio, mime: type.split(';')[0], provider }
}

async function googleTts(text: string, lang: string): Promise<TtsAudio> {
  const buffers: Uint8Array[] = []
  const pieces = splitForGoogle(text)
  if (pieces.length === 0) throw new Error('testo vuoto')

  for (const piece of pieces) {
    const url =
      'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' +
      encodeURIComponent(lang) +
      '&q=' +
      encodeURIComponent(piece)
    const response = await fetch(url, {
      headers: { 'User-Agent': GOOGLE_USER_AGENT, Referer: 'https://translate.google.com/' },
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('HTTP ' + response.status)
    const part = await readAudio(response, 'google')
    buffers.push(part.audio)
  }
  return { audio: concatAudio(buffers), mime: 'audio/mpeg', provider: 'google' }
}

async function elevenLabsTts(text: string, env: Env): Promise<TtsAudio> {
  const key = env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ELEVENLABS_API_KEY mancante')
  const voice = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
  const model = env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voice), {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error('HTTP ' + response.status)
  return readAudio(response, 'elevenlabs')
}

async function openAiTts(text: string, env: Env): Promise<TtsAudio> {
  const key = env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY mancante')
  const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const response = await fetch(base + '/audio/speech', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.TTS_MODEL || 'gpt-4o-mini-tts',
      voice: env.TTS_VOICE || 'alloy',
      input: text,
      response_format: 'mp3',
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error('HTTP ' + response.status)
  return readAudio(response, 'openai')
}

async function customTts(text: string, lang: string, env: Env): Promise<TtsAudio> {
  const template = env.TTS_CUSTOM_URL
  if (!template) throw new Error('TTS_CUSTOM_URL mancante')
  const url = template
    .split('{text}')
    .join(encodeURIComponent(text))
    .split('{lang}')
    .join(encodeURIComponent(lang))
  const headers: Record<string, string> = {}
  if (env.TTS_CUSTOM_API_KEY) headers.Authorization = 'Bearer ' + env.TTS_CUSTOM_API_KEY
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error('HTTP ' + response.status)
  return readAudio(response, 'custom')
}

// Genera la voce: prova i provider in ordine e restituisce il primo che risponde.
// Se nessuno funziona riporta il motivo di ognuno, senza inventare audio.
export async function synthesizeSpeech(text: string, lang: string, env: Env = process.env): Promise<TtsOutcome> {
  const order = ttsProviderOrder(env)
  if (order.length === 0) return { ok: false, error: 'nessun provider voce configurato' }

  const failures: string[] = []
  for (const id of order) {
    try {
      if (id === 'google') return { ok: true, result: await googleTts(text, lang) }
      if (id === 'elevenlabs') return { ok: true, result: await elevenLabsTts(text, env) }
      if (id === 'openai') return { ok: true, result: await openAiTts(text, env) }
      if (id === 'custom') return { ok: true, result: await customTts(text, lang, env) }
    } catch (e) {
      // Il motivo vero serve: "fetch failed" da solo non dice se manca la chiave,
      // se il servizio e' giu' o se la porta e' chiusa.
      const message = e instanceof Error ? e.message : String(e)
      const cause = e instanceof Error && e.cause ? ' (' + String(e.cause).slice(0, 100) + ')' : ''
      failures.push(LABELS[id] + ': ' + (message + cause).slice(0, 160))
    }
  }

  return { ok: false, error: failures.join(' | ') || 'nessun provider voce disponibile' }
}

// Stato compatto per la diagnostica e per la route (GET /api/tts?info=1).
export function ttsStatus(env: Env = process.env) {
  const order = ttsProviderOrder(env)
  return {
    requested: (env.TTS_PROVIDER || 'auto').toLowerCase(),
    fallback: env.TTS_FALLBACK !== '0',
    willUse: order[0] || null,
    chain: order,
    providers: ttsProviders(env),
    lang: env.TTS_LANG || 'it',
  }
}
