'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Film, Video, Send } from 'lucide-react'

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

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setVideoUrl(null)
    setVideoError(null)
    setTtMsg(null)
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
      const caption = result ? result.script.caption + ' ' + result.script.hashtags.join(' ') : ''
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

  const tones = ['energico', 'elegante', 'divertente', 'professionale', 'urgente']
  const platforms = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook']

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Sparkles className='text-brand' size={22} /> AI Ads Generator
        </h1>
        <p className='text-sm text-white/50'>Genera script, copy e creatività per i tuoi video ads con AI</p>
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
                <p className='text-lg font-medium'>{result.script.hook}</p>
              </div>

              <div className='glass p-5'>
                <div className='mb-3 text-sm font-medium'>Storyboard</div>
                <div className='space-y-3'>
                  {result.script.scenes.map((sc, i) => (
                    <div key={i} className='flex gap-3 rounded-xl border border-white/5 p-3'>
                      <div className='shrink-0 rounded-lg bg-brand/15 px-2 py-1 text-xs text-brand'>{sc.time}</div>
                      <div className='text-sm'>
                        <div className='text-white/80'>{sc.visual}</div>
                        <div className='mt-1 text-white/50'>🎤 {sc.voiceover}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='glass p-5'>
                  <div className='mb-2 text-sm font-medium'>Call to action</div>
                  <p className='text-sm text-white/80'>{result.script.cta}</p>
                </div>
                <div className='glass p-5'>
                  <div className='mb-2 text-sm font-medium'>Caption</div>
                  <p className='text-sm text-white/80'>{result.script.caption}</p>
                  <p className='mt-2 text-sm text-brand'>{result.script.hashtags.join(' ')}</p>
                </div>
              </div>

              <div className='glass p-5'>
                <div className='mb-3 flex items-center justify-between'>
                  <div className='text-sm font-medium'>Creatività AI</div>
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
                  <p className='text-xs text-white/40'>{result.note}</p>
                )}

                {videoError ? <p className='mt-3 text-xs text-amber-400'>{videoError}</p> : null}
                {videoUrl ? <video src={videoUrl} controls className='mt-3 w-full rounded-xl' /> : null}
              </div>

              <div className='glass p-5'>
                <div className='mb-2 text-sm font-medium'>Pubblica su TikTok</div>
                <p className='mb-3 text-xs text-white/40'>Incolla un URL pubblico del video: useremo la caption e gli hashtag generati.</p>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <input value={ttUrl} onChange={(e) => setTtUrl(e.target.value)} placeholder='https://.../video.mp4' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand/50' />
                  <button onClick={publishTikTok} disabled={ttLoading || !ttUrl} className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm text-white transition hover:bg-brand-dark disabled:opacity-50'>
                    {ttLoading ? <Loader2 size={14} className='animate-spin' /> : <Send size={14} />} Pubblica
                  </button>
                </div>
                {ttMsg ? <p className='mt-3 text-xs text-white/60'>{ttMsg}</p> : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
