// Pacchetto pubblicitario condiviso: normalizzazione dei dati AI, hashtag,
// keyword, sottotitoli SRT/VTT e prompt di livello studio.
//
// Un solo posto per le regole: generate-ad, auto-ads e autopilot usano queste
// funzioni, cosi il formato di uscita e' identico ovunque e nessuna route
// reinventa la propria normalizzazione.
//
// La divisione in righe delle caption arriva da lib/subtitles.ts: e' la stessa
// che usano l'anteprima in pagina e il video esportato.

import { subtitleBlock, SUBTITLE_MAX_CHARS } from './subtitles'

export type AdScene = {
  time: string
  visual: string
  voiceover: string
  text: string
}

export type SubtitleCue = { index: number; start: number; end: number; text: string }

// Intervallo reale di ogni scena: serve all'anteprima per mostrare il frame
// giusto e ai sottotitoli per restare sincronizzati con lo storyboard.
export type SceneTiming = { index: number; start: number; end: number; text: string }

export type AdSubtitles = {
  cues: SubtitleCue[]
  srt: string
  vtt: string
  totalSeconds: number
  scenes: SceneTiming[]
}

export type AdScript = {
  hook: string
  variants: string[]
  title: string
  description: string
  scenes: AdScene[]
  cta: string
  caption: string
  hashtags: string[]
  keywords: string[]
  targeting: string
  tone: string
  platform: string
  subtitles: AdSubtitles
  motionPrompt: string
  thumbnailPrompt: string
}

// --- Coercizione sicura ---

export function toText(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(' ')
  if (typeof v === 'object') {
    const keys = ['visual', 'scene', 'scena', 'text', 'testo', 'description', 'descrizione', 'value', 'voiceover']
    for (let i = 0; i < keys.length; i++) {
      if (typeof v[keys[i]] === 'string') return v[keys[i]]
    }
    return Object.keys(v).map((k) => toText(v[k])).filter(Boolean).join(' ')
  }
  return String(v)
}

export function toLines(v: any): string[] {
  if (v === null || v === undefined) return []
  if (Array.isArray(v)) return v.map(toText).filter(Boolean)
  const s = toText(v)
  return s ? [s] : []
}

// --- Scene ---

export function normalizeScenes(v: any): AdScene[] {
  if (!Array.isArray(v)) return []
  return v.map((s: any, i: number) => {
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const time = toText(s.time || s.tempo || s.timing || s.secondi) || ('0-' + (i + 1) * 4 + 's')
      let visual = toText(s.visual || s.visivo || s.scene || s.scena || s.description || s.descrizione || s.azione)
      const voiceover = toText(s.voiceover || s.voce || s.voiceOver || s.audio || s.speech || s.narration)
      const text = toText(s.text || s.testo || s.onscreen || s.onScreen || s.sottotitolo || s.subtitle)
      if (!visual) visual = toText(s)
      return { time, visual, voiceover, text: text || shortOverlay(voiceover) }
    }
    const single = toText(s)
    return { time: '0-' + (i + 1) * 4 + 's', visual: single, voiceover: '', text: shortOverlay(single) }
  })
}

// Testo a schermo breve: le ads funzionano con 3-6 parole in grande.
function shortOverlay(source: string): string {
  const clean = String(source || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const words = clean.split(' ')
  return words.slice(0, 6).join(' ')
}

// --- Hashtag e keyword ---

export function normalizeHashtags(v: any, max = 15): string[] {
  const list: string[] = []
  const push = (raw: string) => {
    let tag = String(raw || '').replace(/\s+/g, '').replace(/[^#\p{L}\p{N}_]/gu, '')
    if (!tag) return
    if (tag.charAt(0) !== '#') tag = '#' + tag
    tag = tag.replace(/#+/g, '#')
    if (tag.length < 2) return
    if (list.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    list.push(tag)
  }
  if (Array.isArray(v)) v.forEach((x) => push(toText(x)))
  else
    toText(v)
      .split(/[\s,;]+/)
      .forEach((x) => push(x))
  return list.slice(0, max)
}

export function normalizeKeywords(v: any, max = 10): string[] {
  const list: string[] = []
  const push = (raw: string) => {
    const word = String(raw || '').replace(/^#+/, '').replace(/\s+/g, ' ').trim()
    if (!word) return
    if (list.some((k) => k.toLowerCase() === word.toLowerCase())) return
    list.push(word)
  }
  if (Array.isArray(v)) v.forEach((x) => push(toText(x)))
  else
    toText(v)
      .split(/[\n,;]+/)
      .forEach((x) => push(x))
  return list.slice(0, max)
}

// --- Sottotitoli ---

// Legge un intervallo tipo "0-4s" / "0 a 3 secondi" / "12". Se non c'e',
// assegna una finestra di 4 secondi in base alla posizione della scena.
export function parseTimeRange(time: string, index: number, fallback = 4): { start: number; end: number } {
  const raw = String(time || '').replace(',', '.')
  const range = raw.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/)
  if (range) {
    const a = parseFloat(range[1])
    const b = parseFloat(range[2])
    if (isFinite(a) && isFinite(b) && b > a) return { start: a, end: b }
  }
  const single = raw.match(/(\d+(?:\.\d+)?)/)
  if (single) {
    const s = parseFloat(single[1])
    if (isFinite(s)) return { start: s, end: s + fallback }
  }
  return { start: index * fallback, end: index * fallback + fallback }
}

// Spezza il testo in righe da sottotitolo: massimo 2 righe da ~42 caratteri,
// senza tagliare le parole a meta. Le righe vengono bilanciate (52+52 invece di
// 84+20), cosi il sottotitolo resta leggibile e centrato sul video.
function chunkCaption(text: string, maxChars = SUBTITLE_MAX_CHARS): string[] {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= maxChars) return [clean]

  const words = clean.split(' ')
  const count = Math.ceil(clean.length / maxChars)
  const target = clean.length / count
  const chunks: string[] = []
  let current = ''

  for (let i = 0; i < words.length; i++) {
    const candidate = current ? current + ' ' + words[i] : words[i]
    const mustSplit = current !== '' && chunks.length < count - 1 && candidate.length > target + 10
    if (mustSplit) {
      chunks.push(current)
      current = words[i]
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function pad(n: number, size = 2): string {
  return String(Math.floor(n)).padStart(size, '0')
}

function srtTime(seconds: number): string {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.round((s - Math.floor(s)) * 1000)
  return pad(h) + ':' + pad(m) + ':' + pad(sec) + ',' + pad(ms, 3)
}

function vttTime(seconds: number): string {
  return srtTime(seconds).replace(',', '.')
}

export function srtFromCues(cues: SubtitleCue[]): string {
  return cues
    .map((c) => c.index + '\n' + srtTime(c.start) + ' --> ' + srtTime(c.end) + '\n' + subtitleBlock(c.text))
    .join('\n\n') + (cues.length ? '\n' : '')
}

export function vttFromCues(cues: SubtitleCue[]): string {
  const body = cues
    .map((c) => vttTime(c.start) + ' --> ' + vttTime(c.end) + '\n' + subtitleBlock(c.text))
    .join('\n\n')
  return 'WEBVTT\n\n' + body + (cues.length ? '\n' : '')
}

// Costruisce i sottotitoli dallo storyboard: il voiceover di ogni scena viene
// diviso in cue leggibili e distribuito sulla durata reale della scena.
export function buildSubtitles(scenes: AdScene[]): AdSubtitles {
  const cues: SubtitleCue[] = []
  const timings: SceneTiming[] = []
  let cursor = 0
  let total = 0

  scenes.forEach((scene, i) => {
    const range = parseTimeRange(scene.time, i)
    const start = Math.max(range.start, cursor)
    const end = Math.max(range.end, start + 1)
    cursor = end
    total = Math.max(total, end)
    timings.push({ index: i, start, end, text: scene.text || shortOverlay(scene.voiceover) })

    const source = (scene.voiceover || scene.text || '').trim()
    const chunks = chunkCaption(source)
    if (chunks.length === 0) return

    const span = (end - start) / chunks.length
    chunks.forEach((chunk, j) => {
      cues.push({
        index: cues.length + 1,
        start: Math.round((start + j * span) * 1000) / 1000,
        end: Math.round((start + (j + 1) * span) * 1000) / 1000,
        text: chunk,
      })
    })
  })

  if (cues.length === 0) total = Math.max(total, scenes.length * 4)

  return {
    cues,
    srt: srtFromCues(cues),
    vtt: vttFromCues(cues),
    totalSeconds: Math.round(total * 10) / 10,
    scenes: timings,
  }
}

// --- Prompt professionali ---

export type AdRequest = {
  product?: string
  audience?: string
  tone?: string
  platform?: string
  price?: string | number
}

export function adSystemPrompt(): string {
  return (
    'Sei un direttore creativo e media buyer senior di uno studio pubblicitario specializzato in performance ads verticali (TikTok, Reels, YouTube Shorts). ' +
    'Scrivi in italiano. Il tuo copy e concreto, mai generico: parla di benefici visibili, obiezioni reali e prova sociale credibile. ' +
    'Struttura sempre le ads con il ritmo che converte: hook nei primi 2 secondi, problema, dimostrazione, prova, offerta, CTA. ' +
    'Conosci le regole di distribuzione: caption leggibili, hashtag misti (grandi, di nicchia, specifici), descrizioni con le prime due righe che invogliano ad aprire "altro", ' +
    'testi a schermo brevi (3-6 parole) che restano leggibili su schermo verticale. Non usi promesse impossibili ne dati inventati.'
  )
}

export function adPrompt(b: AdRequest, durationSeconds = 20): string {
  return (
    'Crea il PACCHETTO DI PUBBLICAZIONE COMPLETO per un video ad verticale di ' + durationSeconds + ' secondi del prodotto "' + (b.product || 'prodotto') + '". ' +
    'Pubblico: ' + (b.audience || 'pubblico ampio') + '. Tono: ' + (b.tone || 'energico') + '. ' +
    'Piattaforma principale: ' + (b.platform || 'TikTok') + '. ' +
    (b.price ? 'Prezzo: ' + b.price + ' euro. ' : '') +
    'Restituisci un JSON con queste chiavi: ' +
    'hook (stringa: prima frase che ferma lo scroll, massimo 12 parole), ' +
    'variants (array di 3 hook alternativi per A/B test), ' +
    'title (stringa max 90 caratteri, con keyword, per YouTube Shorts), ' +
    'description (stringa di 700-1000 caratteri pronta da incollare: prima riga = gancio, poi 3-4 righe di benefici concreti, poi un elenco puntato con 4 emoji, poi CTA all acquisto con segnaposto [LINK], e in fondo una riga di hashtag; usa \\n per andare a capo), ' +
    'scenes (array di 5 oggetti con: time nel formato "0-3s", visual (cosa si vede e come si muove la camera), voiceover (la frase esatta da dire), text (testo a schermo di 3-6 parole)), ' +
    'cta (stringa breve), ' +
    'caption (stringa max 150 caratteri con 1-2 emoji), ' +
    'hashtags (array di 12 hashtag virali in italiano e inglese: 3 molto grandi, 5 di nicchia, 4 specifici del prodotto; ognuno gia con il #), ' +
    'keywords (array di 10 keyword in italiano senza #, per i tag di YouTube), ' +
    'targeting (stringa con pubblico, eta, interessi e orario consigliato).'
  )
}

export const adStrictSuffix =
  ' IMPORTANTE: usa ESATTAMENTE queste chiavi in inglese. Alla radice: hook, variants, title, description, scenes, cta, caption, hashtags, keywords, targeting. ' +
  'Ogni elemento di scenes deve avere SOLO le chiavi time, visual, voiceover e text, tutte con valore stringa. ' +
  'hashtags deve essere un array di 12 stringhe che iniziano con #, senza spazi. keywords deve essere un array di 10 stringhe senza #. ' +
  'NON usare chiavi in italiano e non annidare oggetti dentro le scene.'

// Prompt di movimento per il modello video: linguaggio da studio (ottica,
// luce, camera, color grading) per avere un clip che sembra girato, non generato.
export function motionPrompt(product: string, scene?: AdScene): string {
  const visual = scene && scene.visual ? ' ' + scene.visual : ''
  return (
    'Cinematic vertical product commercial shot of ' + (product || 'the product') + '.' + visual +
    ' Camera: slow dolly in with subtle parallax. Lens: 35mm, shallow depth of field. ' +
    'Lighting: soft key light with rim light, glossy reflections on the product. ' +
    'Color grading: modern warm highlights with cool shadows. Ultra detailed, 9:16 vertical framing, product stays centered, ' +
    'smooth steady motion, advertising quality, no text, no watermark, no distorted anatomy.'
  )
}

export function thumbnailPrompt(product: string, tone: string): string {
  return (
    'High end e-commerce advertising key visual for ' + (product || 'product') + ', ' + (tone || 'modern') +
    ' mood, product centered with negative space at the top, studio softbox lighting, clean gradient background, ' +
    'floating shadows, premium packaging feel, ultra detailed, vertical 9:16, no text'
  )
}

// --- Assemblaggio del pacchetto ---

export function buildAdScript(data: any, b: AdRequest, durationSeconds = 20): AdScript | null {
  if (!data || !data.hook || !Array.isArray(data.scenes)) return null

  const scenes = normalizeScenes(data.scenes)
  if (scenes.length === 0) return null

  let hashtags = normalizeHashtags(data.hashtags, 15)
  let keywords = normalizeKeywords(data.keywords, 10)

  // Se l AI dimentica gli hashtag, li deriviamo dalle keyword generate: restano
  // pertinenti al prodotto, non sono tag inventati a caso.
  if (hashtags.length < 4) {
    hashtags = normalizeHashtags(['#fyp', '#viral', '#perte', '#shopping'].concat(keywords), 15)
  }
  if (keywords.length === 0) keywords = normalizeKeywords(hashtags, 10)

  return {
    hook: toText(data.hook),
    variants: Array.isArray(data.variants) ? data.variants.map(toText).filter(Boolean).slice(0, 5) : [],
    title: toText(data.title).slice(0, 120),
    description: toText(data.description),
    scenes,
    cta: toText(data.cta),
    caption: toText(data.caption),
    hashtags,
    keywords,
    targeting: toText(data.targeting),
    tone: b.tone || 'energico',
    platform: b.platform || 'TikTok',
    subtitles: buildSubtitles(scenes),
    motionPrompt: motionPrompt(b.product || 'prodotto', scenes[0]),
    thumbnailPrompt: thumbnailPrompt(b.product || 'prodotto', b.tone || 'moderno'),
  }
}
