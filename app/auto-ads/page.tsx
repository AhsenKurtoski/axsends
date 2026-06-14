'use client'

import { useState } from 'react'
import { Megaphone, Loader2, Send, Youtube, ListPlus } from 'lucide-react'

type AdItem = {
  product: { id: string; name: string; image: string; price: number; score: number; label: string }
  tiktok: any
  youtube: any
  ok: boolean
}

export default function AutoAdsPage() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ads, setAds] = useState<AdItem[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    setNote(null)
    setAds([])
    try {
      const res = await fetch('/api/auto-ads?limit=6&q=' + encodeURIComponent(keyword))
      const data = await res.json()
      setNote(data.note || null)
      setAds(Array.isArray(data.ads) ? data.ads : [])
    } catch (err) {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  async function saveToQueue(product: string, platform: string, title: string, caption: string, hashtags: any) {
    try {
      const res = await fetch('/api/ad-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, platform, title, caption, hashtags }),
      })
      const data = await res.json()
      if (data.ok) setNote('Salvato in coda: ' + product + ' (' + platform + '). Aprila dalla voce Coda.')
      else setNote(data.note || 'Per salvare in coda servono le chiavi Supabase.')
    } catch (err) {
      setNote('Errore nel salvataggio in coda')
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Megaphone className='text-brand' size={22} /> Ads automatiche
        </h1>
        <p className='text-sm text-white/50'>
          Un clic: l AI trova i prodotti con potenziale e scrive le ads per TikTok e YouTube. Nessun prompt da scrivere.
        </p>
      </header>

      <div className='glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end'>
        <div className='flex-1'>
          <label className='mb-1 block text-xs text-white/50'>Nicchia (opzionale)</label>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder='Es. cucina, fitness, gadget' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
        </div>
        <button onClick={run} disabled={loading} className='flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
          {loading ? (
            <>
              <Loader2 size={16} className='animate-spin' /> Genero ads...
            </>
          ) : (
            <>
              <Megaphone size={16} /> Genera ads automatiche
            </>
          )}
        </button>
      </div>

      {error ? <div className='glass p-5 text-sm text-rose-400'>{error}</div> : null}
      {note ? <div className='glass p-4 text-sm text-white/60'>{note}</div> : null}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {ads.map((a) => (
          <div key={a.product.id} className='glass space-y-4 p-5'>
            <div className='flex items-center gap-3'>
              {a.product.image && a.product.image.indexOf('http') === 0 ? (
                <img src={a.product.image} alt={a.product.name} className='h-14 w-14 rounded-xl object-cover' />
              ) : (
                <div className='grid h-14 w-14 place-items-center rounded-xl bg-white/5 text-xl'>📦</div>
              )}
              <div className='min-w-0'>
                <div className='truncate text-sm font-medium'>{a.product.name}</div>
                <div className='text-xs text-white/50'>{a.product.price} euro · punteggio {a.product.score} · {a.product.label}</div>
              </div>
            </div>

            {a.tiktok ? (
              <div className='rounded-xl border border-white/5 p-4'>
                <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Send size={15} className='text-brand' /> TikTok
                </div>
                <p className='text-sm text-white/80'>{a.tiktok.hook}</p>
                <p className='mt-2 text-sm text-white/60'>{a.tiktok.caption}</p>
                {Array.isArray(a.tiktok.hashtags) ? <p className='mt-1 text-sm text-brand'>{a.tiktok.hashtags.join(' ')}</p> : null}
                {Array.isArray(a.tiktok.script) ? (
                  <ul className='mt-2 list-disc space-y-1 pl-5 text-xs text-white/50'>
                    {a.tiktok.script.map((sc: string, i: number) => (
                      <li key={i}>{sc}</li>
                    ))}
                  </ul>
                ) : null}
                <button onClick={() => saveToQueue(a.product.name, 'tiktok', a.tiktok.hook || '', a.tiktok.caption || '', a.tiktok.hashtags)} className='mt-3 flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20'>
                  <ListPlus size={13} /> Salva in coda
                </button>
              </div>
            ) : null}

            {a.youtube ? (
              <div className='rounded-xl border border-white/5 p-4'>
                <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Youtube size={16} className='text-rose-400' /> YouTube
                </div>
                <p className='text-sm font-medium text-white/80'>{a.youtube.title}</p>
                <p className='mt-2 text-sm text-white/60'>{a.youtube.description}</p>
                {Array.isArray(a.youtube.tags) ? <p className='mt-1 text-sm text-brand'>{a.youtube.tags.join(' ')}</p> : null}
                {Array.isArray(a.youtube.script) ? (
                  <ul className='mt-2 list-disc space-y-1 pl-5 text-xs text-white/50'>
                    {a.youtube.script.map((sc: string, i: number) => (
                      <li key={i}>{sc}</li>
                    ))}
                  </ul>
                ) : null}
                <button onClick={() => saveToQueue(a.product.name, 'youtube', a.youtube.title || '', a.youtube.description || '', a.youtube.tags)} className='mt-3 flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20'>
                  <ListPlus size={13} /> Salva in coda
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
