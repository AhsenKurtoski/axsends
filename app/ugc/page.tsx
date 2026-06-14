'use client'

import { useState } from 'react'
import { Clapperboard, Loader2, Copy, Check } from 'lucide-react'

function str(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(' ')
  if (typeof v === 'object') return Object.keys(v).map((k) => str(v[k])).filter(Boolean).join(' ')
  return String(v)
}

export default function UgcPage() {
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setData(null)
    setNote('')
    try {
      const res = await fetch('/api/ugc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })
      const d = await res.json()
      setData(d.data)
      setNote(d.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  function copyEmail() {
    if (!data || !data.pitchEmail) return
    try {
      navigator.clipboard.writeText(str(data.pitchEmail))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      // clipboard non disponibile
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Clapperboard className='text-brand' size={22} /> UGC Studio
        </h1>
        <p className='text-sm text-white/50'>Guadagna come UGC creator: vendi video ai brand (50-150 EUR a video), anche senza followers.</p>
      </header>

      <form onSubmit={generate} className='glass flex flex-col gap-3 p-5 sm:flex-row'>
        <input value={product} onChange={(e) => setProduct(e.target.value)} required placeholder='Prodotto o brand (es. crema viso)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
        <button type='submit' disabled={loading} className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
          {loading ? <><Loader2 size={16} className='animate-spin' /> Genero...</> : <><Clapperboard size={16} /> Genera materiale UGC</>}
        </button>
      </form>
      {note ? <p className='text-xs text-white/40'>{note}</p> : null}

      {data ? (
        <div className='space-y-4'>
          {Array.isArray(data.scripts) && data.scripts.length > 0 ? (
            <div className='glass space-y-3 p-5'>
              <div class​Name='text-sm font-medium'>Script video</div>
              {data.scripts.map((s: any, i: number) => (
                <div key={i} className='rounded-xl border border-white/5 p-3'>
                  <div className='text-sm font-medium text-brand'>{str(s && s.hook)}</div>
                  {Array.isArray(s && s.scenes) ? (
                    <ul className='mt-2 space-y-1 text-sm text-white/70'>
                      {s.scenes.map((sc: any, j: number) => (<li key={j}>{(j + 1) + '. ' + str(sc)}</li>))}
                    </ul>
                  ) : null}
                  <div className='mt-2 text-sm text-emerald-400'>{str(s && s.cta)}</div>
                </div>
              ))}
            </div>
          ) : null}

          {Array.isArray(data.rateCard) && data.rateCard.length > 0 ? (
            <div className='glass p-5'>
              <div className='mb-3 text-sm font-medium'>Listino prezzi (rate card)</div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                {data.rateCard.map((r: any, i: number) => (
                  <div key={i} className='rounded-xl border border-white/10 bg-white/5 p-4'>
                    <div className='text-sm font-medium'>{str(r && r.pacchetto)}</div>
                    <div className='mt-1 text-2xl font-bold text-emerald-400'>€{str(r && r.prezzo)}</div>
                    <p className='mt-1 text-xs text-white/50'>{str(r && r.include)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {data.pitchEmail ? (
            <div className='glass p-5'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='text-sm font-medium'>Email per proporti ai brand</div>
                <button onClick={copyEmail} className='flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/5'>
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiata' : 'Copia'}
                </button>
              </div>
              <p className='whitespace-pre-wrap text-sm text-white/70'>{str(data.pitchEmail)}</p>
            </div>
          ) : null}

          {Array.isArray(data.tips) && data.tips.length > 0 ? (
            <div className='glass p-5'>
              <div className='mb-2 text-sm font-medium'>Come trovare clienti</div>
              <ul className='space-y-1 text-sm text-white/70'>
                {data.tips.map((t: any, i: number) => (<li key={i}>• {str(t)}</li>))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
          Inserisci un prodotto e genera script, listino prezzi ed email pronti da inviare ai brand.
        </div>
      )}
    </div>
  )
}
