'use client'

import { useState } from 'react'
import { Globe, Loader2, Download, ExternalLink, Monitor, Smartphone, Copy, Check, Sparkles } from 'lucide-react'

const COLORS = [
  { n: 'Viola', h: '#7c5cff' },
  { n: 'Blu', h: '#2563eb' },
  { n: 'Verde', h: '#10b981' },
  { n: 'Rosso', h: '#ef4444' },
  { n: 'Arancio', h: '#f97316' },
  { n: 'Rosa', h: '#ec4899' },
  { n: 'Oro', h: '#d4af37' },
  { n: 'Nero', h: '#111827' },
]

function swatchStyle(h: string) {
  return { backgroundColor: h }
}

export default function WebsitePage() {
  const [business, setBusiness] = useState('')
  const [type, setType] = useState('Sito vetrina')
  const [style, setStyle] = useState('Moderno e premium')
  const [goal, setGoal] = useState('Generazione contatti')
  const [language, setLanguage] = useState('Italiano')
  const [color, setColor] = useState('#7c5cff')
  const [images, setImages] = useState(true)
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [html, setHtml] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [device, setDevice] = useState('desktop')
  const [copied, setCopied] = useState(false)

  const types = ['Sito vetrina', 'Landing prodotto', 'Ristorante o bar', 'Estetista o barbiere', 'Palestra', 'Studio professionale', 'Agenzia o azienda', 'E-commerce one-page', 'Portfolio personale', 'Evento o matrimonio']
  const styles = ['Moderno e premium', 'Minimal elegante', 'Scuro e lussuoso', 'Colorato e giovane', 'Corporate e serio', 'Editoriale e raffinato']
  const goals = ['Generazione contatti', 'Vendite online', 'Prenotazioni', 'Brand e immagine', 'Iscrizioni/lista email']
  const languages = ['Italiano', 'Inglese', 'Spagnolo', 'Francese', 'Tedesco']

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setHtml(null)
    setNote('')
    setCopied(false)
    try {
      const res = await fetch('/api/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business, type, style, goal, language, color, images, contact }),
      })
      const d = await res.json()
      setHtml(d.html)
      setNote(d.note || '')
    } catch (err) {
      setNote('Errore di rete, riprova.')
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

  async function copyCode() {
    if (!html) return
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // clipboard non disponibile
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Globe className='text-brand' size={22} /> Web Studio
        </h1>
        <p className='text-sm text-white/50'>L AI crea siti premium multi-sezione di livello agenzia. Vendili da 500 a 10.000 EUR.</p>
      </header>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={generate} className='glass h-fit space-y-4 p-5'>
          <div className='flex items-center gap-2 text-sm font-medium'><Sparkles size={15} className='text-brand' /> Crea un sito premium</div>
          <input value={business} onChange={(e) => setBusiness(e.target.value)} required placeholder='Nome attivita (es. Studio Legale Rossi)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />

          <div>
            <label className='mb-1 block text-xs text-white/50'>Tipo di sito</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {types.map((t) => (<option key={t} value={t} className='bg-[#12121f]'>{t}</option>))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-xs text-white/50'>Stile visivo</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {styles.map((s) => (<option key={s} value={s} className='bg-[#12121f]'>{s}</option>))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-xs text-white/50'>Obiettivo</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {goals.map((g) => (<option key={g} value={g} className='bg-[#12121f]'>{g}</option>))}
            </select>
          </div>

          <div>
            <label className='mb-1 block text-xs text-white/50'>Lingua dei testi</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50'>
              {languages.map((l) => (<option key={l} value={l} className='bg-[#12121f]'>{l}</option>))}
            </select>
          </div>

          <div>
            <label className='mb-1.5 block text-xs text-white/50'>Colore del brand</label>
            <div className='flex flex-wrap gap-2'>
              {COLORS.map((c) => (
                <button key={c.h} type='button' title={c.n} onClick={() => setColor(c.h)} style={swatchStyle(c.h)} className={'h-7 w-7 rounded-full border-2 transition ' + (color === c.h ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100')} />
              ))}
            </div>
          </div>

          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder='Contatti (tel, email, citta) - opzionale' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />

          <label className='flex cursor-pointer items-center gap-2 text-xs text-white/60'>
            <input type='checkbox' checked={images} onChange={(e) => setImages(e.target.checked)} className='accent-brand' /> Includi immagini reali (consigliato)
          </label>

          <button type='submit' disabled={loading} className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
            {loading ? <><Loader2 size={16} className='animate-spin' /> Creo il sito premium...</> : <><Globe size={16} /> Genera sito</>}
          </button>
          {note ? <p className='text-xs text-white/40'>{note}</p> : null}
          {loading ? <p className='text-xs text-white/30'>Un sito completo richiede 20-60 secondi. Attendi senza ricaricare.</p> : null}
        </form>

        <div className='lg:col-span-2'>
          {!html ? (
            <div className='glass grid min-h-[320px] place-items-center p-5 text-center text-sm text-white/40'>
              Compila i campi e genera un sito web premium completo, pronto da vendere o pubblicare.
            </div>
          ) : (
            <div className='glass space-y-3 p-5'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='text-sm font-medium'>Anteprima sito</div>
                <div className='flex flex-wrap gap-2'>
                  <div className='flex overflow-hidden rounded-lg border border-white/15'>
                    <button onClick={() => setDevice('desktop')} className={'flex items-center gap-1 px-2.5 py-1.5 text-xs transition ' + (device === 'desktop' ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/5')}><Monitor size={13} /> Desktop</button>
                    <button onClick={() => setDevice('mobile')} className={'flex items-center gap-1 px-2.5 py-1.5 text-xs transition ' + (device === 'mobile' ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/5')}><Smartphone size={13} /> Mobile</button>
                  </div>
                  <button onClick={copyCode} className='flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/5'>
                    {copied ? <><Check size={13} className='text-emerald-400' /> Copiato</> : <><Copy size={13} /> Copia codice</>}
                  </button>
                  <button onClick={openTab} className='flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/5'>
                    <ExternalLink size={13} /> Apri
                  </button>
                  <button onClick={download} className='flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-xs text-white transition hover:bg-brand-dark'>
                    <Download size={13} /> Scarica .html
                  </button>
                </div>
              </div>
              <div className={device === 'mobile' ? 'mx-auto w-[390px] max-w-full' : 'w-full'}>
                <iframe srcDoc={html} title='Anteprima sito' className='h-[640px] w-full rounded-xl border border-white/10 bg-white' />
              </div>
              <p className='text-xs text-white/40'>Scarica il file .html oppure pubblicalo gratis su Netlify Drop o GitHub Pages e consegnalo al cliente con il suo dominio.</p>
            </div>
          )}
        </div>
      </div>

      <div className='glass p-5'>
        <div className='mb-3 text-sm font-medium text-white/80'>Come vendere i siti (prezzi reali di mercato)</div>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
            <div className='text-xs uppercase tracking-wide text-white/40'>Base</div>
            <div className='mt-1 text-lg font-semibold'>500 - 1.500 EUR</div>
            <p className='mt-1 text-xs text-white/50'>Sito vetrina one-page per attivita locali: bar, estetiste, artigiani. Consegna rapida.</p>
          </div>
          <div className='rounded-xl border border-brand/40 bg-brand/10 p-4'>
            <div className='text-xs uppercase tracking-wide text-brand'>Pro - piu richiesto</div>
            <div className='mt-1 text-lg font-semibold'>2.000 - 4.500 EUR</div>
            <p className='mt-1 text-xs text-white/60'>Sito multi-sezione con SEO, copy persuasivo, form contatti e branding curato per PMI e studi.</p>
          </div>
          <div className='rounded-xl border border-white/10 bg-white/5 p-4'>
            <div className='text-xs uppercase tracking-wide text-white/40'>Premium</div>
            <div className='mt-1 text-lg font-semibold'>6.000 - 10.000+ EUR</div>
            <p className='mt-1 text-xs text-white/50'>Progetto completo per aziende: identita, e-commerce/funnel, animazioni e manutenzione mensile.</p>
          </div>
        </div>
        <p className='mt-3 text-xs text-white/40'>Il prezzo dipende dal valore per il cliente (quanti clienti/vendite gli porta), non dalle ore. Parti dal Pro: con 2-3 clienti al mese fai numeri seri. Nessun guadagno e garantito: dipende da quanti contatti chiudi.</p>
      </div>
    </div>
  )
}
