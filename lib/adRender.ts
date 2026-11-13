// Renderer del video pubblicitario con sottotitoli bruciati.
//
// Vive fuori dalla pagina Ads: la pagina prepara i dati (scene, cue, immagini) e
// qui si disegna e registra l'MP4. Le righe delle caption arrivano da
// lib/subtitles.ts, quindi il video mostra le stesse righe del file SRT.
// Tutto gira nel browser: nessun ffmpeg, nessun server.

import { subtitleLines } from './subtitles'

export type RenderCue = { start: number; end: number; text: string }
export type RenderScene = { start: number; end: number }

export type AdRenderOptions = {
  scenes: RenderScene[]
  cues: RenderCue[]
  images: string[]
  duration: number
  width?: number
  height?: number
  fps?: number
  onProgress?: (ratio: number) => void
}

export type AdRenderResult = { blob: Blob; mime: string; extension: 'mp4' | 'webm' }

const DEFAULT_WIDTH = 720
const DEFAULT_HEIGHT = 1280
const DEFAULT_FPS = 30
const CAPTION_SIZE = 52
const CAPTION_MAX_WIDTH = 0.86

export function rendererSupported(): boolean {
  return typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined'
}

// Ordine di preferenza: MP4 H.264 (pronto per il caricamento), poi WebM.
export function preferredMime(): string {
  if (!rendererSupported()) return 'video/webm'
  const candidates = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm']
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    } catch {
      // ignoro e provo il successivo
    }
  }
  return 'video/webm'
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

// Registra l'ad completa in tempo reale e restituisce il file.
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
    onProgress,
  } = options

  if (images.length === 0) throw new Error('nessuna immagine da animare')
  if (!(duration > 0)) throw new Error('durata non valida')

  const loaded = await loadImages(images)
  if (loaded.length === 0) throw new Error('immagine non caricabile')

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas non disponibile')

  const mime = preferredMime()
  const stream = canvas.captureStream(fps)
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start(200)
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
  await stopped

  const blob = new Blob(chunks, { type: mime })
  if (blob.size === 0) throw new Error('la registrazione non ha prodotto dati')
  return { blob, mime, extension: mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm' }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
