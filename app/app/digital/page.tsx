'use client'

import { useState } from 'react'
import { BookOpen, Loader2, Download } from 'lucide-react'

function str(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(' ')
  if (typeof v === 'object') return Object.keys(v).map((k) => str(v[k])).filter(Boolean).join(' ')
  return String(v)
}

function buildEbookHtml(d: any): string {
  const title = str(d.title)
  const subtitle = str(d.subtitle)
  const chapters = Array.isArray(d.outline) ? d.outline : []
  const body = chapters
    .map((c: any, i: number) => '<h2>' + (i + 1) + '. ' + str(c && c.chapter) + '</h2><p>' + str(c && c.content) + '</p>')
    .join('')
  const pitch = d.salesPitch ? '<div class="pitch"><strong>Perche comprarlo:</strong> ' + str(d.salesPitch) + '</div>' : ''
  const css =
    'body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.7;color:#1a1a1a}' +
    'h1{font-size:32px;color:#5b3df5}h2{margin-top:34px;color:#5b3df5}' +
    '.sub{color:#666;font-style:italic;font-size:18px}' +
    '.pitch{margin-top:40px;padding:16px;background:#f4f1ff;border-radius:12px}'
  return (
    '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + title + '</title><style>' + css + '</style></head><body>' +
    '<h1>' + title + '</h1><p class="sub">' + subtitle + '</p>' + body + pitch +
    '</body></html>'
  )
}

export default function DigitalPage() {
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [note, setNote] = useState('')

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setData(null)
    setNote('')
    try {
      const res = await fetch('/api/digital-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, audience }),
      })
      const d = await res.json()
      setData(d.product)
      setNote(d.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  function downloadEbook() {
    if (!data) return
    try {
      const html = buildEbookHtml(data)
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (str(data.title) || 'ebook').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      // download non disponibile
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <BookOpen className='text-brand' size={22} /> Prodotti digitali
        </h1>
        <p className='text-sm text-white/50'>Crea ebook e guide vendibili (margine quasi 100%). L AI scrive il contenuto reale e lo scarichi come file.</p>
      </header>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <form onSubmit={generate} className='glass h-fit space-y-4 p-5'>
          <div className='text-sm font-medium'>Genera un prodotto</div>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder='Tema (es. Risparmiare a 20 anni)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder='Per chi (es. studenti)' className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-brand/50' />
          <button type='submit' disabled={loading} className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'>
            {loading ? <><Loader2 size={16} className='animate-spin' /> Genero...</> : <><BookOpen size={16} /> Genera prodotto</>}
          </button>
          {note ? <p className='text-xs text-white/40'>{note}</p> : null}
        </form>

        <div className='lg:col-span-2'>
          {!data ? (
            <div className='glass grid min-h-[200px] place-items-center p-5 text-center text-sm text-white/40'>
              Scegli un tema e genera un prodotto digitale pronto da vendere.
            </div>
          ) : (
            <div className='glass space-y-4 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h2 className='text-xl font-semibold'>{str(data.title)}</h2>
                  <p className='text-sm text-white/60'>{str(data.subtitle)}</p>
                </div>
                <button onClick={downloadEbook} className='flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-xs text-white transition hover:bg-brand-dark'>
                  <Download size={13} /> Scarica ebook
                </button>
              </div>
              {data.price ? <div className='text-2xl font-bold text-emerald-400'>€{str(data.price)}</div> : null}
              {Array.isArray(data.where) && data.where.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {data.where.map((w: any, i: number) => (
                    <span key={i} className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70'>Vendi su: {str(w)}</span>
                  ))}
                </div>
              ) : null}
              {Array.isArray(data.outline) && data.outline.length > 0 ? (
                <div className='space-y-2'>
                  <div className='text-sm font-medium'>Contenuto</div>
                  {data.outline.map((c: any, i: number) => (
                    <details key={i} className='rounded-xl border border-white/5 p-3'>
                      <summary className='cursor-pointer text-sm font-medium'>{str(c && c.chapter) || ('Capitolo ' + (i + 1))}</summary>
                      <p className='mt-2 text-sm leading-relaxed text-white/60'>{str(c && c.content)}</p>
                    </details>
                  ))}
                </div>
              ) : null}
              {data.salesPitch ? <div className='rounded-xl border border-brand/20 bg-brand/10 p-3 text-sm text-white/80'>{str(data.salesPitch)}</div> : null}
              <p className='text-xs text-white/40'>Scarica l ebook in HTML, aprilo nel browser e usa Stampa - Salva come PDF per ottenere il PDF da vendere su Gumroad/Etsy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
