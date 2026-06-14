'use client'

import { useState } from 'react'
import { Shirt, Loader2 } from 'lucide-react'

function str(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(' ')
  if (typeof v === 'object') return Object.keys(v).map((k) => str(v[k])).filter(Boolean).join(' ')
  return String(v)
}

export default function PodPage() {
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [designs, setDesigns] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [note, setNote] = useState('')

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setDesigns([])
    setPlatforms([])
    setNote('')
    try {
      const res = await fetch('/api/pod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
      })
      const d = await res.json()
      setDesigns(Array.isArray(d.designs) ? d.designs : [])
      setPlatforms(Array.isArray(d.platforms) ? d.platforms : [])
      setNote(d.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Shirt className='text-brand' size={22} /> Print on Demand
        </h1>
        <p className='text-sm text-white/50'>Design AI (slogan + concept) da vendere su Redbubble, Etsy e Merch. Zero magazzino, zero costi iniziali.</p>
      </header>

      <form onSubmit={generate} className='glass flex flex-col gap-3 p-5 sm:flex-row'>
        <input value={niche} onChange={(e) => setNiche(e.target.value)} required placeholder='Nicchia (es. amanti dei cani, palestra, gamer)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
        <button type='submit' disabled={loading} className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
          {loading ? <><Loader2 size={16} className='animate-spin' /> Genero...</> : <><Shirt size={16} /> Genera design</>}
        </button>
      </form>
      {note ? <p className='text-xs text-white/40'>{note}</p> : null}

      {platforms.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {platforms.map((p, i) => (
            <span key={i} className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70'>Vendi su: {str(p)}</span>
          ))}
        </div>
      ) : null}

      {designs.length > 0 ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {designs.map((d, i) => (
            <div key={i} className='glass flex flex-col gap-2 p-5'>
              <div className='text-base font-semibold text-brand'>{str(d && d.slogan)}</div>
              <p className='text-xs text-white/60'>{str(d && d.concept)}</p>
              <div className='mt-auto flex items-center justify-between pt-2 text-xs text-white/40'>
                <span className='rounded-full bg-white/5 px-2 py-0.5'>{str(d && d.product)}</span>
                <span>{str(d && d.audience)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
          Scrivi una nicchia e genera 6 idee di design pronte da caricare.
        </div>
      )}
    </div>
  )
}
