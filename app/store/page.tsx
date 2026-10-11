'use client'

import { useEffect, useState } from 'react'
import { Store, Loader2, Copy, Check, Plus, Trash2 } from 'lucide-react'

function str(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(' ')
  if (typeof v === 'object') return Object.keys(v).map((k) => str(v[k])).filter(Boolean).join(' ')
  return String(v)
}

type Lead = { id: string; name: string; contact: string; product: string }

export default function StorePage() {
  const [product, setProduct] = useState('')
  const [price, setPrice] = useState('')
  const [audience, setAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState<any>(null)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  const [leads, setLeads] = useState<Lead[]>([])
  const [lname, setLname] = useState('')
  const [lcontact, setLcontact] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ahsends_leads') || localStorage.getItem('axsends_leads')
      if (raw) setLeads(JSON.parse(raw))
    } catch (err) {
      // nessun lead salvato
    }
  }, [])

  function persist(next: Lead[]) {
    setLeads(next)
    try {
      localStorage.setItem('ahsends_leads', JSON.stringify(next))
    } catch (err) {
      // localStorage non disponibile
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setPage(null)
    setNote('')
    try {
      const res = await fetch('/api/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, price, audience }),
      })
      const data = await res.json()
      setPage(data.page)
      setNote(data.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  function copyAll() {
    if (!page) return
    const benefits = Array.isArray(page.benefits) ? page.benefits.map((x: any) => '• ' + str(x)).join('\n') : ''
    const parts = [str(page.headline), str(page.subheadline), benefits, str(page.cta)]
    try {
      navigator.clipboard.writeText(parts.filter(Boolean).join('\n\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      // clipboard non disponibile
    }
  }

  function addLead(e: React.FormEvent) {
    e.preventDefault()
    if (!lname || !lcontact) return
    const item: Lead = { id: String(Date.now()), name: lname, contact: lcontact, product: product || 'Prodotto' }
    persist([item].concat(leads))
    setLname('')
    setLcontact('')
  }

  function removeLead(id: string) {
    persist(leads.filter((l) => l.id !== id))
  }

  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <Store className='text-brand' size={22} /> Negozio AI AhsenDS
          </h1>
          <p className='text-sm text-white/50'>Genera una landing page che converte &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs text-brand-light self-start sm:self-auto'>
          <span>Costruito da <strong className='text-white'>Ahsen Kurtoski</strong></span>
        </div>
      </header>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={generate} className='glass h-fit space-y-4 p-5'>
          <div className='text-sm font-medium'>Crea la tua landing</div>
          <input value={product} onChange={(e) => setProduct(e.target.value)} required placeholder='Prodotto (es. Lampada LED)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder='Prezzo (es. 24.99)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder='Pubblico (es. studenti)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <button type='submit' disabled={loading} className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
            {loading ? <><Loader2 size={16} className='animate-spin' /> Genero...</> : <><Store size={16} /> Genera landing</>}
          </button>
          {note ? <p className='text-xs text-white/40'>{note}</p> : null}
        </form>

        <div className='space-y-4 lg:col-span-2'>
          {!page ? (
            <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
              Compila e genera la tua landing page di vendita.
            </div>
          ) : (
            <div className='glass space-y-4 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <h2 className='text-xl font-semibold'>{str(page.headline)}</h2>
                <button onClick={copyAll} className='flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/5'>
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiato' : 'Copia'}
                </button>
              </div>
              <p className='text-sm text-white/70'>{str(page.subheadline)}</p>
              {Array.isArray(page.benefits) && page.benefits.length > 0 ? (
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  {page.benefits.map((b: any, i: number) => (
                    <div key={i} className='rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-white/80'>✅ {str(b)}</div>
                  ))}
                </div>
              ) : null}
              {Array.isArray(page.bullets) && page.bullets.length > 0 ? (
                <ul className='space-y-1 text-sm text-white/70'>
                  {page.bullets.map((b: any, i: number) => (
                    <li key={i}>• {str(b)}</li>
                  ))}
                </ul>
              ) : null}
              {page.socialProof ? <div className='rounded-xl border border-brand/20 bg-brand/10 p-3 text-sm text-white/80'>⭐ {str(page.socialProof)}</div> : null}
              {Array.isArray(page.faq) && page.faq.length > 0 ? (
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>FAQ</div>
                  {page.faq.map((f: any, i: number) => (
                    <div key={i} className='rounded-xl border border-white/5 p-3'>
                      <div className='text-sm font-medium'>{str(f && f.q)}</div>
                      <div className='mt-1 text-sm text-white/60'>{str(f && f.a)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {page.guarantee ? <p className='text-sm text-emerald-400'>🛡️ {str(page.guarantee)}</p> : null}
              <button className='rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white'>{str(page.cta) || 'Acquista ora'}</button>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={addLead} className='glass h-fit space-y-3 p-5'>
          <div className='text-sm font-medium'>Raccogli ordini / contatti</div>
          <p className='text-xs text-white/40'>Quando qualcuno vuole comprare, salva qui il contatto. Lista privata sul tuo dispositivo.</p>
          <input value={lname} onChange={(e) => setLname(e.target.value)} placeholder='Nome cliente' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <input value={lcontact} onChange={(e) => setLcontact(e.target.value)} placeholder='Email o telefono' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <button type='submit' className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'>
            <Plus size={16} /> Salva contatto
          </button>
        </form>
        <div className='glass p-5 lg:col-span-2'>
          <div className='mb-3 text-sm font-medium'>Contatti / ordini ({leads.length})</div>
          {leads.length === 0 ? (
            <p className='text-sm text-white/40'>Nessun contatto ancora.</p>
          ) : (
            <ul className='space-y-2'>
              {leads.map((l) => (
                <li key={l.id} className='flex items-center justify-between gap-3 rounded-xl border border-white/5 p-3'>
                  <div className='min-w-0'>
                    <div className='text-sm font-medium'>{l.name}</div>
                    <div className='text-xs text-white/40'>{l.contact} - {l.product}</div>
                  </div>
                  <button onClick={() => removeLead(l.id)} className='rounded-lg border border-white/10 p-1.5 text-white/50 transition hover:text-rose-400'>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
