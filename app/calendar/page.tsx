'use client'

import { useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'

function str(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(' ')
  if (typeof v === 'object') return Object.keys(v).map((k) => str(v[k])).filter(Boolean).join(' ')
  return String(v)
}

export default function CalendarPage() {
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('TikTok')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [note, setNote] = useState('')

  const platforms = ['TikTok', 'Instagram', 'YouTube', 'Facebook']

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setPlan(null)
    setNote('')
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platform }),
      })
      const d = await res.json()
      setPlan(d.plan)
      setNote(d.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  const days = plan && Array.isArray(plan.days) ? plan.days : []

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <CalendarDays className='text-brand' size={22} /> Calendario contenuti
        </h1>
        <p className='text-sm text-white/50'>Un piano di 7 giorni pronto da girare, generato dall AI per la tua nicchia.</p>
      </header>

      <form onSubmit={generate} className='glass flex flex-col gap-3 p-5 sm:flex-row'>
        <input value={niche} onChange={(e) => setNiche(e.target.value)} required placeholder='Nicchia (es. accessori cucina)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className='rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
          {platforms.map((p) => (<option key={p} value={p} className='bg-[#12121f]'>{p}</option>))}
        </select>
        <button type='submit' disabled={loading} className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
          {loading ? <><Loader2 size={16} className='animate-spin' /> Genero...</> : <><CalendarDays size={16} /> Genera piano</>}
        </button>
      </form>
      {note ? <p className='text-xs text-white/40'>{note}</p> : null}

      {days.length > 0 ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {days.map((d: any, i: number) => (
            <div key={i} className='glass flex flex-col gap-2 p-4'>
              <div className='text-xs font-semibold text-brand'>{str(d && d.day) || ('Giorno ' + (i + 1))}</div>
              <div className='text-sm font-medium'>{str(d && d.idea)}</div>
              <div className='text-xs text-white/60'>Hook: {str(d && d.hook)}</div>
              <div className='text-xs text-white/40'>Formato: {str(d && d.format)}</div>
              {Array.isArray(d && d.hashtags) ? <div className='mt-auto text-xs text-brand'>{d.hashtags.map((h: any) => str(h)).join(' ')}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
          Scrivi la tua nicchia e genera 7 giorni di contenuti pronti.
        </div>
      )}
    </div>
  )
}
