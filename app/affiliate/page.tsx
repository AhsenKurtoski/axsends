'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'

type AffLink = { id: string; product: string; network: string; url: string; clicks: number; earnings: number }

const NETWORKS = ['Amazon', 'CJ Affiliate', 'Awin', 'AliExpress', 'Impact', 'Altro']

export default function AffiliatePage() {
  const [links, setLinks] = useState<AffLink[]>([])
  const [product, setProduct] = useState('')
  const [network, setNetwork] = useState('Amazon')
  const [url, setUrl] = useState('')
  const [gen, setGen] = useState<any>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [genFor, setGenFor] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('axsends_affiliate')
      if (raw) setLinks(JSON.parse(raw))
    } catch (err) {
      // nessun dato salvato
    }
  }, [])

  function persist(next: AffLink[]) {
    setLinks(next)
    try {
      localStorage.setItem('axsends_affiliate', JSON.stringify(next))
    } catch (err) {
      // localStorage non disponibile
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault()
    if (!product || !url) return
    const item: AffLink = { id: String(Date.now()), product, network, url, clicks: 0, earnings: 0 }
    persist([item].concat(links))
    setProduct('')
    setUrl('')
  }

  function remove(id: string) {
    persist(links.filter((l) => l.id !== id))
  }

  async function generate(l: AffLink) {
    setGenLoading(true)
    setGenFor(l.id)
    setGen(null)
    try {
      const res = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: l.product, link: l.url, network: l.network }),
      })
      setGen(await res.json())
    } catch (err) {
      // errore generazione
    } finally {
      setGenLoading(false)
    }
  }

  const totalEarnings = links.reduce((s, l) => s + (l.earnings || 0), 0)
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0)

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <DollarSign className='text-brand' size={22} /> Affiliate
        </h1>
        <p className='text-sm text-white/50'>Gestisci i link affiliati e genera contenuti promozionali con AI</p>
      </header>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='glass p-5'>
          <div className='text-xs text-white/50'>Link attivi</div>
          <div className='mt-1 text-2xl font-semibold'>{links.length}</div>
        </div>
        <div className='glass p-5'>
          <div className='text-xs text-white/50'>Click totali</div>
          <div className='mt-1 text-2xl font-semibold'>{totalClicks}</div>
        </div>
        <div className='glass p-5'>
          <div className='text-xs text-white/50'>Guadagni stimati</div>
          <div className='mt-1 text-2xl font-semibold text-emerald-400'>{totalEarnings.toFixed(2)} EUR</div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={add} className='glass h-fit space-y-4 p-5'>
          <div className='text-sm font-medium'>Nuovo link affiliato</div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Prodotto</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} required placeholder='Es. Cuffie wireless' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Network</label>
            <select value={network} onChange={(e) => setNetwork(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {NETWORKS.map((n) => (
                <option key={n} value={n} className='bg-[#12121f]'>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Link affiliato</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder='https://...' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          </div>
          <button type='submit' className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'>
            <Plus size={16} /> Aggiungi
          </button>
        </form>

        <div className='space-y-4 lg:col-span-2'>
          {links.length === 0 ? (
            <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
              <div>
                <DollarSign className='mx-auto mb-3 text-white/20' size={40} />
                Aggiungi il tuo primo link affiliato per iniziare.
              </div>
            </div>
          ) : (
            links.map((l) => (
              <div key={l.id} className='glass p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='font-medium'>{l.product}</div>
                    <div className='text-xs text-white/40'>{l.network}</div>
                    <a href={l.url} target='_blank' rel='noreferrer' className='mt-1 block max-w-xs truncate text-xs text-brand'>{l.url}</a>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <button onClick={() => generate(l)} className='flex items-center gap-1 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs text-white transition hover:bg-brand/20'>
                      <Sparkles size={13} /> Contenuto
                    </button>
                    <button onClick={() => remove(l.id)} className='rounded-lg border border-white/10 p-1.5 text-white/50 transition hover:text-rose-400'>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {genFor === l.id ? (
                  <div className='mt-4 border-t border-white/5 pt-4'>
                    {genLoading ? (
                      <div className='flex items-center gap-2 text-sm text-white/50'>
                        <Loader2 size={14} className='animate-spin' /> Genero i contenuti...
                      </div>
                    ) : gen ? (
                      <div className='space-y-3 text-sm'>
                        <div>
                          <div className='text-xs uppercase tracking-wide text-brand'>Caption</div>
                          {gen.captions.map((c: string, i: number) => (
                            <p key={i} className='mt-1 text-white/80'>{c}</p>
                          ))}
                        </div>
                        <p className='text-brand'>{gen.hashtags.join(' ')}</p>
                        <div className='rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60'>{gen.disclosure}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <p className='text-xs text-white/30'>Nota: i guadagni sono una stima inserita manualmente. Nessun guadagno e garantito: dipende da traffico e conversioni.</p>
    </div>
  )
}
