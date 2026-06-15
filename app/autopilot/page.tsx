'use client'

import { useState } from 'react'
import { Wand2, Loader2, Sparkles, Globe, Download, ExternalLink, Package, ListPlus, Check, Search } from 'lucide-react'

function txt(v: any): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(txt).filter(Boolean).join(' ')
  if (typeof v === 'object') {
    const keys = ['visual', 'scene', 'scena', 'text', 'description', 'descrizione', 'value', 'voiceover']
    for (let i = 0; i < keys.length; i++) {
      if (v[keys[i]] != null) return txt(v[keys[i]])
    }
    return Object.values(v).map(txt).filter(Boolean).join(' ')
  }
  return ''
}
function lines(v: any): string[] {
  if (v == null) return []
  if (Array.isArray(v)) return v.map(txt).filter(Boolean)
  const s = txt(v)
  return s ? [s] : []
}

export default function AutopilotPage() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState('')
  const [queued, setQueued] = useState(false)

  async function run() {
    setLoading(true)
    setData(null)
    setErr('')
    setQueued(false)
    try {
      const url = '/api/autopilot?limit=6' + (keyword ? '&q=' + encodeURIComponent(keyword) : '')
      const r = await fetch(url)
      const j = await r.json()
      setData(j)
    } catch (e) {
      setErr('Errore di rete, riprova.')
    }
    setLoading(false)
  }

  function downloadHtml(html: string, name: string) {
    const blob = new Blob([html], { type: 'text/html' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = u
    a.download = name
    a.click()
    URL.revokeObjectURL(u)
  }

  function openHtml(html: string) {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
    }
  }

  async function queueAd() {
    if (!data || !data.best || !data.best.ad) return
    const best = data.best
    try {
      await fetch('/api/ad-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: txt(best.product && best.product.name),
          platform: 'tiktok',
          title: best.ad.hook,
          caption: best.ad.caption,
          hashtags: best.ad.hashtags,
        }),
      })
      setQueued(true)
    } catch (e) {
      setQueued(false)
    }
  }

  const best = data && data.best
  const ad = best && best.ad
  const website = best && best.website

  return (
    <div className='space-y-6'>
      <header className='flex items-start gap-3'>
        <div className='grid h-11 w-11 place-items-center rounded-2xl bg-brand/15 text-brand'>
          <Wand2 size={22} />
        </div>
        <div>
          <h1 className='text-2xl font-semibold'>Autopilot</h1>
          <p className='text-sm text-white/50'>Un clic: trova prodotti elettronica reali, li salva, genera l ad virale e la landing page del prodotto.</p>
        </div>
      </header>

      <div className='glass space-y-4 p-5'>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <div className='flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5'>
            <Search size={16} className='text-white/40' />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='Nicchia o prodotto (vuoto = elettronica a caso)'
              className='w-full bg-transparent text-sm outline-none placeholder:text-white/30'
            />
          </div>
          <button
            onClick={run}
            disabled={loading}
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'
          >
            {loading ? <Loader2 size={16} className='animate-spin' /> : <Wand2 size={16} />}
            {loading ? 'Sto lavorando...' : 'Avvia Autopilot'}
          </button>
        </div>
        <div className='grid grid-cols-2 gap-2 text-xs text-white/50 sm:grid-cols-4'>
          <div className='rounded-lg bg-white/5 px-3 py-2'>1. Trova prodotti</div>
          <div className='rounded-lg bg-white/5 px-3 py-2'>2. Salva catalogo</div>
          <div className='rounded-lg bg-white/5 px-3 py-2'>3. Genera ad</div>
          <div className='rounded-lg bg-white/5 px-3 py-2'>4. Genera sito</div>
        </div>
        {loading ? (
          <p className='text-xs text-white/40'>Puo richiedere 20-40 secondi: sto cercando su CJ, salvando e facendo scrivere ad e sito dall AI.</p>
        ) : null}
      </div>

      {err ? <div className='glass border border-rose-500/30 p-4 text-sm text-rose-300'>{err}</div> : null}

      {data && data.ok === false ? (
        <div className='glass border border-amber-500/30 p-4 text-sm text-amber-200'>{txt(data.note)}</div>
      ) : null}

      {data && data.ok ? (
        <div className='space-y-6'>
          <div className='glass flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm'>
            <span className='text-white/70'>Ricerca: <b className='text-white'>{txt(data.keyword)}</b></span>
            <span className='text-white/70'>Prodotti: <b className='text-white'>{data.count}</b></span>
            <span className='text-white/70'>Salvati: <b className='text-white'>{data.saved}</b></span>
            <span className='text-white/70'>AI: <b className='text-white'>{txt(data.provider)}</b></span>
          </div>

          {data.savedNote ? <div className='glass p-3 text-xs text-white/50'>{txt(data.savedNote)}</div> : null}
          {data.aiNote ? <div className='glass border border-amber-500/30 p-3 text-xs text-amber-200'>{txt(data.aiNote)}</div> : null}

          <div>
            <h2 className='mb-3 flex items-center gap-2 text-lg font-medium'><Package size={18} /> Prodotti trovati</h2>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
              {(data.products || []).map((p: any) => (
                <div key={p.id} className='glass overflow-hidden p-2'>
                  <div className='mb-2 grid h-24 place-items-center overflow-hidden rounded-lg bg-white/5'>
                    {p.image && String(p.image).indexOf('http') === 0 ? (
                      <img src={p.image} alt={txt(p.name)} className='h-full w-full object-cover' />
                    ) : (
                      <span className='text-3xl'>\ud83d\udce6</span>
                    )}
                  </div>
                  <div className='line-clamp-2 text-xs text-white/80'>{txt(p.name)}</div>
                  <div className='mt-1 flex items-center justify-between text-xs'>
                    <span className='font-semibold text-white'>\u20ac{p.suggestedPrice}</span>
                    <span className='text-brand'>{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ad ? (
            <div className='glass space-y-3 p-5'>
              <div className='flex items-center justify-between'>
                <h2 className='flex items-center gap-2 text-lg font-medium'><Sparkles size={18} className='text-brand' /> Ad virale per: {txt(best.product && best.product.name)}</h2>
                <button
                  onClick={queueAd}
                  className='inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20'
                >
                  {queued ? <Check size={14} /> : <ListPlus size={14} />}
                  {queued ? 'In coda' : 'Salva in coda'}
                </button>
              </div>
              <div>
                <div className='text-xs uppercase tracking-wide text-white/40'>Hook</div>
                <p className='text-sm text-white/90'>{txt(ad.hook)}</p>
              </div>
              <div>
                <div className='text-xs uppercase tracking-wide text-white/40'>Didascalia</div>
                <p className='text-sm text-white/80'>{txt(ad.caption)}</p>
              </div>
              <div>
                <div className='text-xs uppercase tracking-wide text-white/40'>Script</div>
                <ol className='mt-1 space-y-1 text-sm text-white/80'>
                  {lines(ad.script).map((s, i) => (
                    <li key={i} className='rounded-lg bg-white/5 px-3 py-1.5'>{s}</li>
                  ))}
                </ol>
              </div>
              <div>
                <div className='text-xs uppercase tracking-wide text-white/40'>Hashtag</div>
                <p className='text-sm text-brand'>{lines(ad.hashtags).map((h) => '#' + h.replace(/^#/, '')).join(' ')}</p>
              </div>
            </div>
          ) : null}

          {website && website.html ? (
            <div className='glass space-y-3 p-5'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <h2 className='flex items-center gap-2 text-lg font-medium'><Globe size={18} className='text-brand' /> Landing page del prodotto</h2>
                <div className='flex gap-2'>
                  <button onClick={() => openHtml(website.html)} className='inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20'>
                    <ExternalLink size={14} /> Apri
                  </button>
                  <button onClick={() => downloadHtml(website.html, 'landing-prodotto.html')} className='inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-dark'>
                    <Download size={14} /> Scarica .html
                  </button>
                </div>
              </div>
              {!website.complete ? <p className='text-xs text-amber-200'>Il sito potrebbe essere incompleto: riavvia l Autopilot per una versione completa.</p> : null}
              <iframe title='Anteprima landing' srcDoc={website.html} sandbox='allow-scripts allow-same-origin' className='h-[640px] w-full rounded-xl border border-white/10 bg-white' />
            </div>
          ) : null}
        </div>
      ) : null}

      {!data && !loading ? (
        <div className='glass p-4 text-xs text-white/50'>
          Suggerimento: lascia il campo vuoto per scoprire prodotti elettronica diversi ogni volta, oppure scrivi una nicchia (es. cuffie, smartwatch, gaming). Per il salvataggio serve Supabase; per ad e sito serve una chiave AI (Groq e gratis).
        </div>
      ) : null}
    </div>
  )
}
