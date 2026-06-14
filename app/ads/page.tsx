'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Film, Video, Send, Youtube, Instagram, Share2 } from 'lucide-react'

type Scene = { time: string; visual: string; voiceover: string }
type AdResult = {
  configured: boolean
  note: string
  imagePrompt: string
  image: string | null
  script: {
    hook: string
    scenes: Scene[]
    cta: string
    caption: string
    hashtags: string[]
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

export default function AdsPage() {
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('energico')
  const [platform, setPlatform] = useState('TikTok')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [videoLoading, setVideoLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
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

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setVideoUrl(null)
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
    setVideoUrl(null)
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: result.imagePrompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVideoError(data.error || 'Video non disponibile')
      } else {
        setVideoUrl(data.video)
      }
    } catch (err) {
      setVideoError('Errore di rete')
    } finally {
      setVideoLoading(false)
    }
  }

  async function publishTikTok() {
    setTtLoading(true)
    setTtMsg(null)
    try {
      const caption = result ? txt(result.script.caption) + ' ' + hashtagText(result.script.hashtags) : ''
      const res = await fetch('/api/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: ttUrl, caption }),
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
      const title = result ? txt(result.script.hook) : 'Nuovo video'
      const description = result ? txt(result.script.caption) + ' ' + hashtagText(result.script.hashtags) : ''
      const tags = result ? hashtagList(result.script.hashtags).map((h) => h.replace('#', '')) : []
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: ytUrl, title, description, tags }),
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
      const caption = result ? txt(result.script.caption) + ' ' + hashtagText(result.script.hashtags) : ''
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: igUrl, caption }),
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
      const caption = result ? txt(result.script.caption) + ' ' + hashtagText(result.script.hashtags) : ''
      const title = result ? txt(result.script.hook) : 'Nuovo video'
      const tags = result ? hashtagList(result.script.hashtags).map((h) => h.replace('#', '')) : []
      const res = await fetch('/api/publish-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: allUrl, caption, title, description: caption, tags }),
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

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Sparkles className='text-brand' size={22} /> AI Ads Generator
        </h1>
        <p className='text-sm text-white/50'>Genera script, copy e creativita per i tuoi video ads con AI</p>
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
              </div>

              <div className='glass p-5'>
                <div className='mb-3 text-sm font-medium'>Storyboard</div>
                <div className='space-y-3'>
                  {scenes.map((sc: any, i: number) => (
                    <div key={i} className='flex gap-3 rounded-xl border border-white/5 p-3'>
                      <div className='shrink-0 rounded-lg bg-brand/15 px-2 py-1 text-xs text-brand'>{txt(sc && sc.time) || ('Scena ' + (i + 1))}</div>
                      <div className='text-sm'>
                        <div className='text-white/80'>{txt(sc && sc.visual) || txt(sc)}</div>
                        <div className='mt-1 text-white/50'>🎤 {txt(sc && sc.voiceover)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='glass p-5'>
                  <div className='mb-2 text-sm font-medium'>Call to action</div>
                  <p className='text-sm text-white/80'>{txt(result.script.cta)}</p>
                </div>
                <div className='glass p-5'>
                  <div className='mb-2 text-sm font-medium'>Caption</div>
                  <p className='text-sm text-white/80'>{txt(result.script.caption)}</p>
                  <p className='mt-2 text-sm text-brand'>{hashtagText(result.script.hashtags)}</p>
                </div>
              </div>

              <div className='glass p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div className='text-sm font-medium'>Creativita AI</div>
                  <button onClick={generateVideo} disabled={videoLoading} className='flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs text-white transition hover:bg-brand/20 disabled:opacity-50'>
                    {videoLoading ? (
                      <>
                        <Loader2 size={14} className='animate-spin' /> Genero video...
                      </>
                    ) : (
                      <>
                        <Video size={14} /> Genera video AI
                      </>
                    )}
                  </button>
                </div>

                {result.image ? (
                  <img src={result.image} alt='Creativita AI' className='w-full rounded-xl' />
                ) : (
                  <p className='text-xs text-white/40'>{txt(result.note)}</p>
                )}

                {videoError ? <p className='mt-3 text-xs text-amber-400'>{videoError}</p> : null}
                {videoUrl ? <video src={videoUrl} controls className='mt-3 w-full rounded-xl' /> : null}
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <div className='glass p-5'>
                  <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                    <Send size={15} className='text-brand' /> TikTok
                  </div>
                  <p className='mb-3 text-xs text-white/40'>URL pubblico del video + caption/hashtag.</p>
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
                  <p className='mb-3 text-xs text-white/40'>URL pubblico del video + titolo/descrizione.</p>
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
                <p className='mb-3 text-xs text-white/40'>Un solo URL video: lo pubblica su tutte le piattaforme configurate con titolo, descrizione e hashtag generati.</p>
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
