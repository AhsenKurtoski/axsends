'use client'

import { useState, useEffect } from 'react'
import { recordAd, downloadBlob, rendererSupported } from '@/lib/adRender'
import { subtitleLines } from '@/lib/subtitles'
import {
  Sparkles, Loader2, Film, Video, Send, Youtube, Instagram, Share2, Download, Copy, Check, Hash, FileText, Captions, Play, Pause,
} from 'lucide-react'

type Scene = { time: string; visual: string; voiceover: string; text?: string }
type Cue = { index: number; start: number; end: number; text: string }
type AdResult = {
  configured: boolean
  note: string
  provider?: string
  imagePrompt: string
  image: string | null
  script: {
    hook: string
    variants: string[]
    title: string
    description: string
    scenes: Scene[]
    cta: string
    caption: string
    hashtags: string[]
    keywords: string[]
    targeting: string
    subtitles?: { cues: Cue[]; srt: string; vtt: string; totalSeconds: number; scenes?: Cue[] }
  }
}

// Converte qualsiasi valore (stringa, numero, oggetto, array) in testo sicuro da
// mostrare in React. L'AI a volte restituisce le scene come oggetti annidati
// (es. { scene: ... }): questa funzione evita il crash mostrando comunque il testo.
function txt(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(txt).filter(Boolean).join(' ')
  if (typeof v === 'object') {
    if (typeof v.scene === 'string') return v.scene
    if (typeof v.text === 'string') return v.text
    if (typeof v.description === 'string') return v.description
    if (typeof v.value === 'string') return v.value
    return Object.keys(v).map((k) => txt(v[k])).filter(Boolean).join(' ')
  }
  return String(v)
}

// Estrae gli hashtag in modo sicuro, qualunque formato arrivi dall'AI.
function hashtagText(hashtags: any): string {
  if (Array.isArray(hashtags)) return hashtags.map(txt).filter(Boolean).join(' ')
  return txt(hashtags)
}

function hashtagList(hashtags: any): string[] {
  if (Array.isArray(hashtags)) return hashtags.map(txt).filter(Boolean)
  const single = txt(hashtags)
  return single ? [single] : []
}

function keywordList(keywords: any, hashtags: any): string[] {
  const list = Array.isArray(keywords) ? keywords.map(txt).filter(Boolean) : []
  if (list.length > 0) return list.map((k) => k.replace(/^#/, ''))
  return hashtagList(hashtags).map((h) => h.replace(/^#/, ''))
}

function downloadText(text: string, name: string, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

// Player dell'anteprima: usa la linea temporale vera dell'ad (le scene dello
// storyboard + i cue SRT), non la durata del clip AI di 3 secondi. Cosi ogni
// frase compare esattamente quando comparera nel video finale.
function StoryboardPreview({
  cues,
  scenes,
  totalSeconds,
  frames,
  cover,
  fileName,
}: {
  cues: Cue[]
  scenes: Cue[]
  totalSeconds: number
  frames: string[]
  cover: string | null
  fileName?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportError, setExportError] = useState<string | null>(null)

  const lastCueEnd = cues.length > 0 ? cues[cues.length - 1].end : 0
  const duration = Math.max(totalSeconds || 0, lastCueEnd, 1)
  const signature = cues.length + ':' + duration + ':' + (cues[0] ? cues[0].text : '')

  useEffect(() => {
    setTime(0)
    setPlaying(false)
  }, [signature])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setTime((t) => {
        const next = t + dt
        return next >= duration ? 0 : next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, duration])

  const sceneIndex = (() => {
    if (scenes.length === 0) return -1
    for (let i = scenes.length - 1; i >= 0; i -= 1) {
      if (time >= scenes[i].start) return i
    }
    return 0
  })()

  const activeScene = sceneIndex >= 0 ? scenes[sceneIndex] : null
  const sceneStart = activeScene ? activeScene.start : 0
  const sceneEnd = activeScene ? activeScene.end : duration
  const sceneDuration = Math.max(sceneEnd - sceneStart, 1)
  const cue = cues.find((c) => time >= c.start && time <= c.end) || null
  const image = frames.length > 0 ? frames[(sceneIndex > 0 ? sceneIndex : 0) % frames.length] : cover

  const clock = (value: number) => {
    const total = Math.max(0, Math.round(value))
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0')
  }

  async function exportVideo() {
    if (recording) return
    setExportError(null)
    const sources = (frames.length > 0 ? frames : cover ? [cover] : []).filter(Boolean) as string[]
    if (sources.length === 0) {
      setExportError('Genera prima la creativita dell ad: serve un immagine per il video.')
      return
    }
    if (!rendererSupported()) {
      setExportError('Questo browser non supporta la registrazione video. Usa Chrome o Edge.')
      return
    }

    setPlaying(false)
    setRecording(true)
    setProgress(0)
    try {
      // Il renderer vive in lib/adRender.ts: qui passo solo i dati.
      const rendered = await recordAd({
        scenes: scenes.map((scene) => ({ start: scene.start, end: scene.end })),
        cues,
        images: sources,
        duration,
        onProgress: setProgress,
      })
      const slug = (fileName || 'ahsends').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
      downloadBlob(rendered.blob, 'ad-' + (slug || 'ahsends') + '-sottotitoli.' + rendered.extension)
    } catch (e) {
      setExportError('Non sono riuscito a creare il video: ' + String(e).slice(0, 120))
    } finally {
      setRecording(false)
      setProgress(0)
    }
  }
  return (
    <div className='glass space-y-3 p-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Captions size={15} className='text-brand' /> Anteprima sottotitoli sincronizzata
        </div>
        <span className='text-[11px] text-white/40'>
          {activeScene
            ? 'Scena ' + (sceneIndex + 1) + '/' + scenes.length + ' - ' + clock(sceneStart) + '-' + clock(sceneEnd)
            : 'Storyboard'}
        </span>
      </div>

      <div className='relative overflow-hidden rounded-xl bg-black' style={{ aspectRatio: '9 / 16' }}>
        {image ? (
          <img
            key={sceneIndex}
            src={image}
            alt='Storyboard'
            className='absolute inset-0 h-full w-full object-cover'
            style={{
              animation: 'ahsends-kenburns ' + sceneDuration + 's linear forwards',
              animationPlayState: playing ? 'running' : 'paused',
            }}
          />
        ) : (
          <div className='flex h-full items-center justify-center px-6 text-center text-xs text-white/40'>
            Genera l ad per vedere l anteprima
          </div>
        )}
        <div className='pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-5'>
          <span
            className='max-w-[88%] text-center text-base font-extrabold uppercase leading-tight tracking-wide text-white'
            style={{ textShadow: '0 2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 0 4px 14px rgba(0,0,0,.9)' }}
          >
            {cue
              ? subtitleLines(cue.text).map((line, i) => (
                  <span key={i} className='block'>
                    {line}
                  </span>
                ))
              : ''}
          </span>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <button
          onClick={() => setPlaying((p) => !p)}
          className='flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20'
        >
          {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? 'Pausa' : 'Play'}
        </button>
        <input
          type='range'
          min={0}
          max={duration}
          step={0.05}
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          className='h-1 flex-1 cursor-pointer'
        />
        <span className='w-20 text-right text-[11px] text-white/50' style={{ fontVariantNumeric: 'tabular-nums' }}>
          {clock(time)} / {clock(duration)}
        </span>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <button
          onClick={exportVideo}
          disabled={recording || cues.length === 0}
          className='flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20 disabled:opacity-40'
        >
          {recording ? <Loader2 size={13} className='animate-spin' /> : <Download size={13} />}
          {recording ? 'Registro l ad... ' + Math.round(progress * 100) + '%' : 'Scarica video completo con sottotitoli'}
        </button>
        <span className='text-[11px] text-white/30'>{recording ? 'Tieni questa scheda aperta' : 'Durata ' + clock(duration) + ' - caption bruciate'}</span>
      </div>

      {exportError ? <p className='text-[11px] text-amber-400'>{exportError}</p> : null}

      <p className='text-[11px] text-white/40'>
        I sottotitoli seguono i tempi reali dell ad ({clock(duration)}), non la durata del clip AI: qui vedi esattamente quando
        ogni frase compare. Lo stesso timing e nel file .srt scaricabile.
      </p>

      <style>{'@keyframes ahsends-kenburns { from { transform: scale(1.02) translate3d(0,0,0); } to { transform: scale(1.14) translate3d(0,-2%,0); } }'}</style>
    </div>
  )
}

export default function AdsPage() {
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('energico')
  const [platform, setPlatform] = useState('TikTok')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const [videoLoading, setVideoLoading] = useState(false)
  const [video, setVideo] = useState<string | null>(null)
  const [frames, setFrames] = useState<string[]>([])
  const [videoNote, setVideoNote] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  const [ttUrl, setTtUrl] = useState('')
  const [ttLoading, setTtLoading] = useState(false)
  const [ttMsg, setTtMsg] = useState<string | null>(null)

  const [ytUrl, setYtUrl] = useState('')
  const [ytLoading, setYtLoading] = useState(false)
  const [ytMsg, setYtMsg] = useState<string | null>(null)

  const [igUrl, setIgUrl] = useState('')
  const [igLoading, setIgLoading] = useState(false)
  const [igMsg, setIgMsg] = useState<string | null>(null)

  const [allUrl, setAllUrl] = useState('')
  const [allLoading, setAllLoading] = useState(false)
  const [allMsg, setAllMsg] = useState<string | null>(null)

  // Se arrivo da Ricerca/Radar con ?product=..., precompilo il prodotto.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const pre = params.get('product')
      if (pre) setProduct(pre)
    } catch (err) {
      // nessun parametro prodotto
    }
  }, [])

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    } catch (err) {
      setCopied(null)
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setVideo(null)
    setFrames([])
    setVideoNote(null)
    setVideoError(null)
    setTtMsg(null)
    setYtMsg(null)
    setIgMsg(null)
    setAllMsg(null)
    try {
      const res = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, audience, tone, platform }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Errore nella generazione')
      } else {
        setResult(data as AdResult)
      }
    } catch (err) {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  async function generateVideo() {
    if (!result) return
    setVideoLoading(true)
    setVideoError(null)
    setVideoNote(null)
    setFrames([])
    setVideo(null)
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: result.imagePrompt, product, scenes: result.script.scenes, image: result.image || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVideoError(data.error || 'Video non disponibile')
      } else {
        setVideo(data.video || null)
        setFrames(Array.isArray(data.frames) ? data.frames : [])
        setVideoNote(data.note || null)
        if (data.videoError) setVideoError(data.videoError)
      }
    } catch (err) {
      setVideoError('Errore di rete')
    } finally {
      setVideoLoading(false)
    }
  }

  function captionWithTags(): string {
    if (!result) return ''
    const caption = txt(result.script.caption)
    const tags = hashtagText(result.script.hashtags)
    return (caption ? caption + '\n\n' : '') + tags
  }

  function fullDescription(): string {
    if (!result) return ''
    const description = txt(result.script.description)
    if (description) return description
    return captionWithTags()
  }

  async function publishTikTok() {
    setTtLoading(true)
    setTtMsg(null)
    try {
      const res = await fetch('/api/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: ttUrl, caption: captionWithTags() }),
      })
      const data = await res.json()
      if (data.ok) {
        setTtMsg('Inviato a TikTok in modalita privata. Apri le notifiche TikTok per completare la pubblicazione.')
      } else {
        setTtMsg(data.error || data.note || 'TikTok non configurato.')
      }
    } catch (err) {
      setTtMsg('Errore di rete')
    } finally {
      setTtLoading(false)
    }
  }

  async function publishYouTube() {
    setYtLoading(true)
    setYtMsg(null)
    try {
      const title = result ? (txt(result.script.title) || txt(result.script.hook) || 'Nuovo video').slice(0, 100) : 'Nuovo video'
      const tags = result ? keywordList(result.script.keywords, result.script.hashtags).slice(0, 20) : []
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: ytUrl, title, description: fullDescription(), tags }),
      })
      const data = await res.json()
      if (data.ok) {
        setYtMsg('Caricato su YouTube come privato. Controlla YouTube Studio per pubblicarlo.')
      } else {
        setYtMsg(data.error || data.note || 'YouTube non configurato.')
      }
    } catch (err) {
      setYtMsg('Errore di rete')
    } finally {
      setYtLoading(false)
    }
  }

  async function publishInstagram() {
    setIgLoading(true)
    setIgMsg(null)
    try {
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: igUrl, caption: captionWithTags() }),
      })
      const data = await res.json()
      if (data.ok) {
        setIgMsg('Pubblicato su Instagram come Reel.')
      } else {
        setIgMsg(data.error || data.note || 'Instagram non configurato.')
      }
    } catch (err) {
      setIgMsg('Errore di rete')
    } finally {
      setIgLoading(false)
    }
  }

  async function publishEverywhere() {
    setAllLoading(true)
    setAllMsg(null)
    try {
      const title = result ? (txt(result.script.title) || txt(result.script.hook) || 'Nuovo video').slice(0, 100) : 'Nuovo video'
      const tags = result ? keywordList(result.script.keywords, result.script.hashtags).slice(0, 20) : []
      const res = await fetch('/api/publish-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: allUrl,
          caption: captionWithTags(),
          title,
          description: fullDescription(),
          tags,
        }),
      })
      const data = await res.json()
      setAllMsg(data.note || 'Operazione completata.')
    } catch (err) {
      setAllMsg('Errore di rete')
    } finally {
      setAllLoading(false)
    }
  }

  const tones = ['energico', 'elegante', 'divertente', 'professionale', 'urgente']
  const platforms = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook']
  const scenes = result && Array.isArray(result.script.scenes) ? result.script.scenes : []
  const tags = result ? hashtagList(result.script.hashtags) : []
  const cues = result && result.script.subtitles && Array.isArray(result.script.subtitles.cues) ? result.script.subtitles.cues : []
  const totalSeconds = result && result.script.subtitles ? result.script.subtitles.totalSeconds : 0

  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <Sparkles className='text-brand' size={22} /> AI Ads Generator
          </h1>
          <p className='text-sm text-white/50'>Script, video, sottotitoli, hashtag virali e descrizione completa per ogni piattaforma &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs text-brand-light self-start sm:self-auto'>
          <span>Costruito da <strong className='text-white'>Ahsen Kurtoski</strong></span>
        </div>
      </header>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={generate} className='glass h-fit space-y-4 p-5'>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Prodotto</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} required placeholder='Es. Mini proiettore HD' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Pubblico</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder='Es. amanti del cinema in casa' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Tono</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {tones.map((t) => (
                <option key={t} value={t} className='bg-[#12121f]'>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Piattaforma</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {platforms.map((p) => (
                <option key={p} value={p} className='bg-[#12121f]'>{p}</option>
              ))}
            </select>
          </div>
          <button type='submit' disabled={loading} className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
            {loading ? (
              <>
                <Loader2 size={16} className='animate-spin' /> Generazione...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Genera ad
              </>
            )}
          </button>
        </form>

        <div className='space-y-4 lg:col-span-2'>
          {error ? <div className='glass p-5 text-sm text-rose-400'>{error}</div> : null}

          {!result && !error ? (
            <div className='glass grid min-h-[300px] place-items-center p-5 text-center text-sm text-white/40'>
              <div>
                <Film className='mx-auto mb-3 text-white/20' size={40} />
                Compila il form e genera lo script del tuo video ad.
              </div>
            </div>
          ) : null}

          {result ? (
            <>
              <div className='glass p-5'>
                <div className='mb-2 text-xs uppercase tracking-wide text-brand'>Hook</div>
                <p className='text-lg font-medium'>{txt(result.script.hook)}</p>
                {Array.isArray(result.script.variants) && result.script.variants.length > 0 ? (
                  <div className='mt-3 space-y-1'>
                    <div className='text-[11px] uppercase tracking-wide text-white/30'>Hook alternativi (A/B test)</div>
                    {result.script.variants.map((v, i) => (
                      <p key={i} className='text-sm text-white/60'>&bull; {txt(v)}</p>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className='glass p-5'>
                <div className='mb-3 text-sm font-medium'>Storyboard</div>
                <div className='space-y-3'>
                  {scenes.map((sc: any, i: number) => (
                    <div key={i} className='flex gap-3 rounded-xl border border-white/5 p-3'>
                      <div className='shrink-0 rounded-lg bg-brand/15 px-2 py-1 text-xs text-brand'>{txt(sc && sc.time) || ('Scena ' + (i + 1))}</div>
                      <div className='min-w-0 text-sm'>
                        <div className='text-white/80'>{txt(sc && sc.visual) || txt(sc)}</div>
                        <div className='mt-1 text-white/50'>🎤 {txt(sc && sc.voiceover)}</div>
                        {sc && sc.text ? (
                          <div className='mt-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/70'>
                            a schermo: {txt(sc.text)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='glass p-5'>
                  <div className='mb-2 text-sm font-medium'>Call to action</div>
                  <p className='text-sm text-white/80'>{txt(result.script.cta)}</p>
                  {txt(result.script.targeting) ? (
                    <p className='mt-3 text-xs text-white/40'>{txt(result.script.targeting)}</p>
                  ) : null}
                </div>
                <div className='glass p-5'>
                  <div className='mb-2 flex items-center justify-between'>
                    <div className='text-sm font-medium'>Caption pronta</div>
                    <button onClick={() => copy(captionWithTags(), 'caption')} className='flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/5'>
                      {copied === 'caption' ? <Check size={12} /> : <Copy size={12} />} Copia
                    </button>
                  </div>
                  <p className='whitespace-pre-wrap text-sm text-white/80'>{txt(result.script.caption)}</p>
                </div>
              </div>

              <div className='glass space-y-3 p-5'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <Captions size={15} className='text-brand' /> Sottotitoli ({cues.length} righe)
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={() => downloadText(result.script.subtitles?.srt || '', 'sottotitoli.srt')}
                      disabled={cues.length === 0}
                      className='flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/5 disabled:opacity-40'
                    >
                      <Download size={12} /> .srt
                    </button>
                    <button
                      onClick={() => downloadText(result.script.subtitles?.vtt || '', 'sottotitoli.vtt')}
                      disabled={cues.length === 0}
                      className='flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/5 disabled:opacity-40'
                    >
                      <Download size={12} /> .vtt
                    </button>
                    <button
                      onClick={() => copy(result.script.subtitles?.srt || '', 'srt')}
                      disabled={cues.length === 0}
                      className='flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/5 disabled:opacity-40'
                    >
                      {copied === 'srt' ? <Check size={12} /> : <Copy size={12} />} Copia
                    </button>
                  </div>
                </div>
                <div className='max-h-52 space-y-1.5 overflow-y-auto rounded-xl bg-black/30 p-3'>
                  {cues.length === 0 ? (
                    <p className='text-xs text-white/40'>Nessun sottotitolo disponibile per questa ad.</p>
                  ) : (
                    cues.map((c) => (
                      <div key={c.index} className='flex gap-2 text-xs'>
                        <span className='shrink-0 font-mono text-white/30'>{c.start.toFixed(1)}s</span>
                        <span className='text-white/75'>{c.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <p className='text-[11px] text-white/40'>Formato da studio: massimo 2 righe, 42 caratteri per riga, tempi allineati al voiceover. Importa il file .srt in CapCut, Premiere o DaVinci per averli bruciati nel video.</p>
              </div>

              <div className='glass space-y-3 p-5'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <Hash size={15} className='text-brand' /> Hashtag virali ({tags.length})
                  </div>
                  <button onClick={() => copy(hashtagText(result.script.hashtags), 'tags')} className='flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/5'>
                    {copied === 'tags' ? <Check size={12} /> : <Copy size={12} />} Copia hashtag
                  </button>
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {tags.map((t, i) => (
                    <span key={i} className='rounded-full bg-brand/15 px-2.5 py-1 text-xs text-brand-light'>{t}</span>
                  ))}
                </div>
                {Array.isArray(result.script.keywords) && result.script.keywords.length > 0 ? (
                  <div className='text-[11px] text-white/40'>Tag YouTube: {result.script.keywords.join(', ')}</div>
                ) : null}
              </div>

              <div className='glass space-y-3 p-5'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <FileText size={15} className='text-brand' /> Titolo e descrizione completa
                  </div>
                  <button onClick={() => copy(fullDescription(), 'desc')} className='flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/5'>
                    {copied === 'desc' ? <Check size={12} /> : <Copy size={12} />} Copia descrizione
                  </button>
                </div>
                <div>
                  <div className='mb-1 text-[11px] uppercase tracking-wide text-white/30'>Titolo (YouTube Shorts)</div>
                  <p className='text-sm font-medium text-white/90'>{txt(result.script.title) || txt(result.script.hook)}</p>
                </div>
                <div>
                  <div className='mb-1 text-[11px] uppercase tracking-wide text-white/30'>Descrizione</div>
                  <p className='whitespace-pre-wrap text-sm text-white/70'>{fullDescription()}</p>
                </div>
              </div>

              <div className='glass p-5'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                  <div className='text-sm font-medium'>Video AI (gratis, senza carta)</div>
                  <button onClick={generateVideo} disabled={videoLoading} className='flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs text-white transition hover:bg-brand/20 disabled:opacity-50'>
                    {videoLoading ? (
                      <>
                        <Loader2 size={14} className='animate-spin' /> Genero il video (puo servire 1 minuto)...
                      </>
                    ) : (
                      <>
                        <Video size={14} /> Genera video AI
                      </>
                    )}
                  </button>
                </div>

                {video ? (
                  <div className='space-y-2'>
                    <div className='relative overflow-hidden rounded-xl bg-black'>
                      <video src={video} controls loop playsInline className='max-h-[520px] w-full' />
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <a href={video} download={'ad-' + (product || 'ahsends').replace(/\s+/g, '-').toLowerCase() + '.mp4'} className='inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20'>
                        <Download size={13} /> Scarica MP4
                      </a>
                      <button
                        onClick={() => downloadText(result.script.subtitles?.srt || '', 'sottotitoli.srt')}
                        disabled={cues.length === 0}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/5 disabled:opacity-40'
                      >
                        <Captions size={13} /> Scarica sottotitoli
                      </button>
                    </div>
                  </div>
                ) : result.image ? (
                  <img src={result.image} alt='Creativita AI' className='w-full max-w-xs rounded-xl' />
                ) : (
                  <p className='text-xs text-white/40'>{txt(result.note)}</p>
                )}

                {videoError ? <p className='mt-3 text-xs text-amber-400'>{videoError}</p> : null}

                {frames.length > 0 ? (
                  <div className='mt-3 space-y-2'>
                    <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                      {frames.map((f, i) => (
                        <a key={i} href={f} download={'frame-' + (i + 1) + '.png'} className='group relative block overflow-hidden rounded-xl'>
                          <img src={f} alt={'Fotogramma ' + (i + 1)} className='w-full rounded-xl' />
                          <span className='absolute bottom-1 right-1 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100'>
                            <Download size={11} /> Scarica
                          </span>
                        </a>
                      ))}
                    </div>
                    {videoNote ? <p className='text-xs text-white/50'>{videoNote}</p> : null}
                  </div>
                ) : null}
              </div>

              <StoryboardPreview
                cues={cues}
                scenes={result.script.subtitles?.scenes || []}
                totalSeconds={totalSeconds}
                frames={frames}
                cover={result.image}
                fileName={product || txt(result.script.title)}
              />

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <div className='glass p-5'>
                  <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                    <Send size={15} className='text-brand' /> TikTok
                  </div>
                  <p className='mb-3 text-xs text-white/40'>URL pubblico del video + caption e hashtag.</p>
                  <div className='flex flex-col gap-2'>
                    <input value={ttUrl} onChange={(e) => setTtUrl(e.target.value)} placeholder='https://.../video.mp4' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand/50' />
                    <button onClick={publishTikTok} disabled={ttLoading || !ttUrl} className='flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm text-white transition hover:bg-brand-dark disabled:opacity-50'>
                      {ttLoading ? <Loader2 size={14} className='animate-spin' /> : <Send size={14} />} Pubblica
                    </button>
                  </div>
                  {ttMsg ? <p className='mt-3 text-xs text-white/60'>{ttMsg}</p> : null}
                </div>

                <div className='glass p-5'>
                  <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                    <Youtube size={16} className='text-rose-400' /> YouTube
                  </div>
                  <p className='mb-3 text-xs text-white/40'>URL pubblico + titolo, descrizione completa e tag.</p>
                  <div className='flex flex-col gap-2'>
                    <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder='https://.../video.mp4' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand/50' />
                    <button onClick={publishYouTube} disabled={ytLoading || !ytUrl} className='flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm text-white transition hover:bg-brand-dark disabled:opacity-50'>
                      {ytLoading ? <Loader2 size={14} className='animate-spin' /> : <Youtube size={14} />} Carica
                    </button>
                  </div>
                  {ytMsg ? <p className='mt-3 text-xs text-white/60'>{ytMsg}</p> : null}
                </div>

                <div className='glass p-5'>
                  <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                    <Instagram size={16} className='text-pink-400' /> Instagram
                  </div>
                  <p className='mb-3 text-xs text-white/40'>URL pubblico del video (Reel) + caption.</p>
                  <div className='flex flex-col gap-2'>
                    <input value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder='https://.../video.mp4' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand/50' />
                    <button onClick={publishInstagram} disabled={igLoading || !igUrl} className='flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm text-white transition hover:bg-brand-dark disabled:opacity-50'>
                      {igLoading ? <Loader2 size={14} className='animate-spin' /> : <Instagram size={14} />} Pubblica
                    </button>
                  </div>
                  {igMsg ? <p className='mt-3 text-xs text-white/60'>{igMsg}</p> : null}
                </div>
              </div>

              <div className='glass p-5'>
                <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Share2 size={16} className='text-brand' /> Pubblica ovunque (Facebook + Instagram + TikTok + YouTube)
                </div>
                <p className='mb-3 text-xs text-white/40'>Un solo URL video: lo pubblica su tutte le piattaforme configurate con titolo, descrizione completa e hashtag generati.</p>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <input value={allUrl} onChange={(e) => setAllUrl(e.target.value)} placeholder='https://.../video.mp4' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand/50' />
                  <button onClick={publishEverywhere} disabled={allLoading || !allUrl} className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm text-white transition hover:bg-brand-dark disabled:opacity-50'>
                    {allLoading ? <Loader2 size={14} className='animate-spin' /> : <Share2 size={14} />} Pubblica ovunque
                  </button>
                </div>
                {allMsg ? <p className='mt-3 text-xs text-white/60'>{allMsg}</p> : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
