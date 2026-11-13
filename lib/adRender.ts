// Renderer del video pubblicitario con sottotitoli bruciati e voiceover.
//
// Vive fuori dalla pagina Ads: la pagina prepara i dati (scene, cue, immagini) e
// qui si disegna, si mixa la voce e si registra il file. Le righe delle caption
// arrivano da lib/subtitles.ts, quindi il video mostra le stesse righe del file
// SRT. Tutto gira nel browser: nessun ffmpeg, nessun server.

import { subtitleLines } from './subtitles'

export type RenderCue = { start: number; end: number; text: string }
export type RenderScene = { start: number; end: number }

export type VoiceOptions = {
  enabled?: boolean
  // Endpoint interno che restituisce l'audio del testo (default /api/tts).
  endpoint?: string
  lang?: string
}

export type AdRenderOptions = {
  scenes: RenderScene[]
  cues: RenderCue[]
  images: string[]
  duration: number
  width?: number
  height?: number
  fps?: number
  voice?: VoiceOptions
  onProgress?: (ratio: number) => void
}

export type AdRenderResult = {
  blob: Blob
  mime: string
  extension: 'mp4' | 'webm'
  hasAudio: boolean
  audioNote: string | null
  videoWidth: number
  videoHeight: number
}

const DEFAULT_WIDTH = 720
const DEFAULT_HEIGHT = 1280
const DEFAULT_FPS = 30
const CAPTION_SIZE = 52
const VOICE_GAIN = 0.9

export function rendererSupported(): boolean {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined'
}

// Ordine di preferenza: MP4 (pronto per il caricamento), poi WebM.
//
// Nota misurata sul campo: chiedere `avc1,mp4a.40.2` a Chrome fa scegliere un
// muxer che scrive un file SENZA traccia video (durata e audio ci sono, i frame
// sono neri). Con il mime `video/mp4` semplice lo stesso browser produce video
// H.264 + audio AAC validi, quindi e' quello che chiediamo.
export function preferredMime(withAudio = false): string {
  if (!rendererSupported()) return 'video/webm'
  const candidates = withAudio
    ? ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
    : ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    } catch {
      // ignoro e provo il successivo
    }
  }
  return 'video/webm'
}

// Legge i metadati del file prodotto: serve a capire se la traccia video c'e'
// davvero (alcuni muxer del browser scrivono audio senza frame).
async function inspectRecording(blob: Blob): Promise<{ width: number; height: number; duration: number }> {
  const url = URL.createObjectURL(blob)
  const video = document.createElement('video')
  video.muted = true
  video.preload = 'metadata'
  video.src = url
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('file non leggibile'))
      setTimeout(() => reject(new Error('tempo scaduto')), 8000)
    })
    return { width: video.videoWidth, height: video.videoHeight, duration: video.duration || 0 }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function loadImage(src: string, cache?: Map<string, HTMLImageElement>): Promise<HTMLImageElement | null> {
  const cached = cache ? cache.get(src) : null
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cache) cache.set(src, img)
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function loadImages(sources: string[], cache?: Map<string, HTMLImageElement>): Promise<HTMLImageElement[]> {
  const loaded = await Promise.all(sources.map((src) => loadImage(src, cache)))
  return loaded.filter((img): img is HTMLImageElement => Boolean(img))
}

// Righe delle caption esattamente come vengono disegnate nel video (maiuscole
// comprese). E' l'unico punto che le produce: i controlli automatici la usano
// per verificare che il video mostri le stesse righe del file SRT.
export function captionLines(text: string): string[] {
  return subtitleLines(text).map((line) => line.toUpperCase())
}

function sceneIndexAt(time: number, scenes: RenderScene[]): number {
  if (scenes.length === 0) return 0
  for (let i = scenes.length - 1; i >= 0; i -= 1) {
    if (time >= scenes[i].start) return i
  }
  return 0
}

function cueAt(time: number, cues: RenderCue[]): RenderCue | null {
  for (const cue of cues) {
    if (time >= cue.start && time <= cue.end) return cue
  }
  return null
}

// Disegna un singolo fotogramma: scena con zoom lento, vignettatura e caption
// divisa nelle stesse righe del file SRT.
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  options: {
    scenes: RenderScene[]
    cues: RenderCue[]
    images: HTMLImageElement[]
    duration: number
    width: number
    height: number
  }
): void {
  const { scenes, cues, images, duration, width, height } = options
  if (images.length === 0) return

  const index = sceneIndexAt(time, scenes)
  const start = scenes[index] ? scenes[index].start : 0
  const end = scenes[index] ? scenes[index].end : duration
  const zoom = 1.03 + 0.12 * Math.min(1, (time - start) / Math.max(0.001, end - start))

  const img = images[index % images.length]
  const scale = Math.max(width / img.width, height / img.height) * zoom
  const drawWidth = img.width * scale
  const drawHeight = img.height * scale
  ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)

  const shade = ctx.createLinearGradient(0, height * 0.5, 0, height)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.7)')
  ctx.fillStyle = shade
  ctx.fillRect(0, height * 0.5, width, height * 0.5)

  const cue = cueAt(time, cues)
  if (!cue) return

  const size = Math.round(CAPTION_SIZE * (width / DEFAULT_WIDTH))
  ctx.font = '800 ' + size + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lines = captionLines(cue.text)
  const lineHeight = size * 1.2
  const baseY = height * 0.79 - ((lines.length - 1) * lineHeight) / 2

  lines.forEach((line, i) => {
    const y = baseY + i * lineHeight
    ctx.lineWidth = Math.max(6, size * 0.23)
    ctx.strokeStyle = 'rgba(0,0,0,0.92)'
    ctx.lineJoin = 'round'
    ctx.strokeText(line, width / 2, y)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(line, width / 2, y)
  })
}

type VoiceTrack = { context: AudioContext; buffer: AudioBuffer } | { error: string } | null

// Scarica la voce di ogni cue e la distende sulla timeline dell'ad: ogni frase
// parte esattamente quando compare il suo sottotitolo.
function createVoiceContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    | typeof AudioContext
    | undefined
  if (!AudioCtor) return null
  try {
    const context = new AudioCtor()
    // Non aspetto la promise: se il browser la tiene sospesa l'export si
    // bloccherebbe a 0%. Con il click dell'utente il contesto parte subito.
    try {
      void context.resume()
    } catch {
      // resta sospeso: l'audio sara' silenzioso ma il video si registra
    }
    return context
  } catch {
    return null
  }
}

async function buildVoiceTrack(
  context: AudioContext,
  cues: RenderCue[],
  duration: number,
  endpoint: string,
  lang: string
): Promise<VoiceTrack> {
  const usable = cues.filter((cue) => cue.text && cue.text.trim().length > 0)
  if (usable.length === 0) return null

  try {
    const clips: { start: number; buffer: AudioBuffer }[] = []
    for (const cue of usable) {
      const separator = endpoint.indexOf('?') >= 0 ? '&' : '?'
      const url = endpoint + separator + 'lang=' + encodeURIComponent(lang) + '&text=' + encodeURIComponent(cue.text)
      const response = await fetch(url, { credentials: 'same-origin' })
      if (!response.ok) {
        let detail = 'HTTP ' + response.status
        try {
          const body = await response.json()
          if (body && body.error) detail = String(body.error)
        } catch {
          // risposta non JSON: tengo il codice
        }
        throw new Error(detail)
      }
      const data = await response.arrayBuffer()
      const buffer = await context.decodeAudioData(data)
      clips.push({ start: Math.max(0, cue.start), buffer })
    }

    const frames = Math.max(1, Math.ceil(duration * context.sampleRate))
    const master = context.createBuffer(1, frames, context.sampleRate)
    const out = master.getChannelData(0)
    for (const clip of clips) {
      const source = clip.buffer.getChannelData(0)
      const offset = Math.min(frames, Math.round(clip.start * context.sampleRate))
      const count = Math.max(0, Math.min(source.length, frames - offset))
      for (let i = 0; i < count; i += 1) out[offset + i] += source[i] * VOICE_GAIN
    }

    // Normalizzazione morbida: evito clipping quando le frasi si sovrappongono.
    let peak = 0
    for (let i = 0; i < frames; i += 1) peak = Math.max(peak, Math.abs(out[i]))
    if (peak > 0.95) {
      const gain = 0.95 / peak
      for (let i = 0; i < frames; i += 1) out[i] *= gain
    }

    return { context, buffer: master }
  } catch (e) {
    return { error: String(e instanceof Error ? e.message : e).slice(0, 140) }
  }
}

// Registra l'ad completa in tempo reale e restituisce il file, voce inclusa.
export async function recordAd(options: AdRenderOptions): Promise<AdRenderResult> {
  if (!rendererSupported()) throw new Error('registrazione video non supportata da questo browser')

  const {
    scenes,
    cues,
    images,
    duration,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    fps = DEFAULT_FPS,
    voice,
    onProgress,
  } = options

  if (images.length === 0) throw new Error('nessuna immagine da animare')
  if (!(duration > 0)) throw new Error('durata non valida')

  const loaded = await loadImages(images)
  if (loaded.length === 0) throw new Error('immagine non caricabile')

  const voiceWanted = !voice || voice.enabled !== false
  // Il contesto audio nasce subito (dentro il gesto di click): se lo creassi
  // dopo le fetch il browser potrebbe tenerlo sospeso per sempre.
  const voiceContext = voiceWanted ? createVoiceContext() : null
  const voiceTrack: VoiceTrack = voiceContext
    ? await Promise.race<VoiceTrack>([
        buildVoiceTrack(voiceContext, cues, duration, (voice && voice.endpoint) || '/api/tts', (voice && voice.lang) || 'it'),
        new Promise<VoiceTrack>((resolve) => setTimeout(() => resolve({ error: 'voiceover: tempo scaduto' }), 25_000)),
      ])
    : null
  const hasVoice = Boolean(voiceTrack && 'buffer' in voiceTrack)
  const audioNote = hasVoice
    ? null
    : voiceWanted
      ? (voiceTrack && 'error' in voiceTrack ? voiceTrack.error : 'voiceover non disponibile')
      : 'voiceover disattivato'

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas non disponibile')

  const mime = preferredMime(hasVoice)
  const stream = canvas.captureStream(fps)

  let voiceSource: AudioBufferSourceNode | null = null
  if (hasVoice && voiceTrack && 'buffer' in voiceTrack) {
    const destination = voiceTrack.context.createMediaStreamDestination()
    voiceSource = voiceTrack.context.createBufferSource()
    voiceSource.buffer = voiceTrack.buffer
    voiceSource.connect(destination)
    try {
      void voiceTrack.context.resume()
    } catch {
      // se il browser blocca l'audio, la registrazione resta senza voce
    }
    for (const track of destination.stream.getAudioTracks()) stream.addTrack(track)
  }

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start(200)
  if (voiceSource) {
    try {
      voiceSource.start()
    } catch {
      // gia avviata
    }
  }
  const startedAt = performance.now()
  let lastTick = -1

  await new Promise<void>((resolve) => {
    const frame = () => {
      const time = (performance.now() - startedAt) / 1000
      if (time >= duration) {
        resolve()
        return
      }
      drawFrame(ctx, time, { scenes, cues, images: loaded, duration, width, height })
      const tick = Math.floor(time * 5)
      if (tick !== lastTick) {
        lastTick = tick
        if (onProgress) onProgress(Math.min(1, time / duration))
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })

  recorder.stop()
  if (voiceSource) {
    try {
      voiceSource.stop()
    } catch {
      // gia fermata
    }
  }
  await stopped

  if (voiceTrack && 'context' in voiceTrack) {
    try {
      await voiceTrack.context.close()
    } catch {
      // niente da fare
    }
  }

  if (voiceContext && (!voiceTrack || !('buffer' in voiceTrack))) {
    try {
      await voiceContext.close()
    } catch {
      // niente da fare
    }
  }

  const blob = new Blob(chunks, { type: mime })
  if (blob.size === 0) throw new Error('la registrazione non ha prodotto dati')

  // Controllo finale: se il browser ha scritto un file senza frame non lo
  // consegno come se fosse buono.
  const info = await inspectRecording(blob)
  if (info.width === 0 || info.height === 0) {
    throw new Error(
      'il browser ha prodotto un file senza traccia video (' + mime + '). Riprova: se capita sempre, disattiva il voiceover o usa Chrome aggiornato.'
    )
  }

  return {
    blob,
    mime,
    extension: mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm',
    hasAudio: hasVoice,
    audioNote,
    videoWidth: info.width,
    videoHeight: info.height,
  }
}

// Verifica che il file registrato contenga davvero voce: decodifica la traccia
// audio e controlla che non sia silenziosa. Cercare i marcatori dei codec nei
// byte del contenitore dava falsi negativi (in MP4 il moov puo' stare in fondo).
export async function hasAudioTrack(blob: Blob): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const AudioCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    | typeof AudioContext
    | undefined
  if (!AudioCtor) return false
  let context: AudioContext | null = null
  try {
    context = new AudioCtor()
    const data = await blob.arrayBuffer()
    const decoded = await context.decodeAudioData(data)
    if (!(decoded.duration > 0)) return false
    const channel = decoded.getChannelData(0)
    for (let i = 0; i < channel.length; i += 64) {
      if (Math.abs(channel[i]) > 0.001) return true
    }
    return false
  } catch {
    return false
  } finally {
    if (context) {
      try {
        await context.close()
      } catch {
        // niente da fare
      }
    }
  }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
