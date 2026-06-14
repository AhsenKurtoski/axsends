'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Loader2, Send, RefreshCw } from 'lucide-react'

type QueueItem = {
  id: number
  product: string
  platform: string
  title: string
  caption: string
  hashtags: string
  video_url: string
  status: string
  scheduled_at: string | null
  created_at: string
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<number | null>(null)
  const [urls, setUrls] = useState<Record<number, string>>({})

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/ad-queue')
      const data = await res.json()
      setNote(data.note || null)
      setItems(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function publish(it: QueueItem) {
    const vurl = urls[it.id] || it.video_url
    if (!vurl) return
    setPublishing(it.id)
    try {
      const res = await fetch('/api/publish-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: vurl,
          caption: it.caption + ' ' + it.hashtags,
          title: it.title,
          description: it.caption,
          tags: it.hashtags ? it.hashtags.split(' ').filter(Boolean) : [],
        }),
      })
      const data = await res.json()
      setNote(data.note || 'Operazione completata.')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setPublishing(null)
    }
  }

  return (
    <div className='space-y-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <CalendarClock className='text-brand' size={22} /> Coda di pubblicazione
          </h1>
          <p className='text-sm text-white/50'>Le ads salvate, pronte da pubblicare su Instagram, TikTok e YouTube.</p>
        </div>
        <button onClick={load} className='flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/5'>
          <RefreshCw size={15} /> Aggiorna
        </button>
      </header>

      {note ? <div className='glass p-4 text-sm text-white/60'>{note}</div> : null}

      {loading ? (
        <div className='glass flex items-center gap-2 p-5 text-sm text-white/50'>
          <Loader2 size={16} className='animate-spin' /> Carico la coda...
        </div>
      ) : items.length === 0 ? (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
          <div>
            <CalendarClock className='mx-auto mb-3 text-white/20' size={40} />
            Nessuna ad in coda. Generale nella pagina Ads automatiche e salvale qui.
          </div>
        </div>
      ) : (
        <div className='space-y-3'>
          {items.map((it) => (
            <div key={it.id} className='glass p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='rounded-lg bg-brand/15 px-2 py-0.5 text-xs text-brand'>{it.platform}</span>
                    <span className='text-sm font-medium'>{it.product}</span>
                  </div>
                  <div className='mt-1 text-sm text-white/70'>{it.title}</div>
                  <p className='mt-1 text-xs text-white/50'>{it.caption}</p>
                  <p className='mt-1 text-xs text-brand'>{it.hashtags}</p>
                </div>
                <button onClick={() => publish(it)} disabled={publishing === it.id || !(urls[it.id] || it.video_url)} className='flex shrink-0 items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs text-white transition hover:bg-brand-dark disabled:opacity-50'>
                  {publishing === it.id ? <Loader2 size={14} className='animate-spin' /> : <Send size={14} />} Pubblica ovunque
                </button>
              </div>
              <input
                value={urls[it.id] || it.video_url || ''}
                onChange={(e) => setUrls((p) => Object.assign({}, p, { [it.id]: e.target.value }))}
                placeholder='URL pubblico del video .mp4 da pubblicare'
                className='mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-brand/50'
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
