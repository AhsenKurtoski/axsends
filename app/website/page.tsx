'use client'

import { useState } from 'react'
import { Globe, Loader2, Download, ExternalLink } from 'lucide-react'

export default function WebsitePage() {
  const [business, setBusiness] = useState('')
  const [type, setType] = useState('Sito vetrina')
  const [style, setStyle] = useState('Moderno e premium')
  const [loading, setLoading] = useState(false)
  const [html, setHtml] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const types = ['Sito vetrina', 'Landing prodotto', 'Ristorante o bar', 'Estetista o barbiere', 'Palestra', 'Studio professionale', 'E-commerce one-page']
  const styles = ['Moderno e premium', 'Minimal elegante', 'Scuro e lussuoso', 'Colorato e giovane']

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setHtml(null)
    setNote('')
    try {
      const res = await fetch('/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business, type, style }),
      })
      const d = await res.json()
      setHtml(d.html)
      setNote(d.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!html) return
    try {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (business || 'sito').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      // download non disponibile
    }
  }

  function openTab() {
    if (!html) return
    try {
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
      }
    } catch (err) {
      // popup bloccato
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Globe className='text-brand' size={22} /> Web Studio
        </h1>
        <p className='text-sm text-white/50'>L AI crea siti web premium completi. Vendili ai negozi locali (200-500 EUR a sito).</p>
      </header>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={generate} className='glass h-fit space-y-4 p-5'>
          <div className='text-sm font-medium'>Crea un sito</div>
          <input value={business} onChange={(e) => setBusiness(e.target.value)} required placeholder='Nome attivita (es. Pizzeria Bella Napoli)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <div>
            <label className='mb-1 block text-xs text-white/50'>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {types.map((t) => (<option key={t} value={t} className='bg-[#12121f]'>{t}</option>))}
            </select>
          </div>
          <div>
            <label className='mb-1 block text-xs text-white/50'>Stile</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {styles.map((s) => (<option key={s} value={s} className='bg-[#12121f]'>{s}</option>))}
            </select>
          </div>
          <button type='submit' disabled={loading} className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
            {loading ? <><Loader2 size={16} className='animate-spin' /> Creo il sito...</> : <><Globe size={16} /> Genera sito</>}
          </button>
          {note ? <p className='text-xs text-white/40'>{note}</p> : null}
        </form>

        <div className='lg:col-span-2'>
          {!html ? (
            <div className='glass grid min-h-[300px] place-items-center p-5 text-center text-sm text-white/40'>
              Inserisci un attivita e genera un sito web premium pronto da vendere.
            </div>
          ) : (
            <div className='glass space-y-3 p-5'>
              <div className='flex items-center justify-between'>
                <div className='text-sm font-medium'>Anteprima sito</div>
                <div className='flex gap-2'>
                  <button onClick={openTab} className='flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/5'>
                    <ExternalLink size={13} /> Apri
                  </button>
                  <button onClick={download} className='flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-xs text-white transition hover:bg-brand-dark'>
                    <Download size={13} /> Scarica .html
                  </button>
                </div>
              </div>
              <iframe srcDoc={html} title='Anteprima sito' className='h-[600px] w-full rounded-xl border border-white/10 bg-white' />
              <p className='text-xs text-white/40'>Scarica il file .html e aprilo nel browser, oppure pubblicalo gratis su Netlify Drop o GitHub Pages e consegnalo al cliente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
