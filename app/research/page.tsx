'use client'

import { useEffect, useState } from 'react'
import { Search, Rocket, Loader2, Download, Check } from 'lucide-react'

type Product = {
  id: string
  name: string
  image: string
  category: string
  cost: number
  suggestedPrice: number
  margin: number
  score: number
  label: string
  popularity: number
  competitorLow: number
  competitorHigh: number
}

export default function ResearchPage() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [imported, setImported] = useState<Record<string, boolean>>({})

  async function load(keyword: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/research?q=' + encodeURIComponent(keyword))
      const data = await res.json()
      setProducts(data.products || [])
      setSource(data.source || '')
      setNote(data.note || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  async function importProduct(p: Product) {
    setImported((s) => Object.assign({}, s, { [p.id]: true }))
    try {
      await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: p.id,
              name: p.name,
              sellPrice: p.cost,
              image: p.image,
              supplier: source === 'cj' ? 'CJ Dropshipping' : 'Demo',
              inventory: 100,
            },
          ],
        }),
      })
    } catch (err) {
      // ignora errori di import in modalita demo
    }
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Rocket className='text-brand' size={22} /> Ricerca prodotti vincenti
        </h1>
        <p className='text-sm text-white/50'>Trova prodotti di qualità con punteggio di potenziale (0-100)</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          load(q)
        }}
        className='glass flex items-center gap-2 px-4 py-2.5'
      >
        <Search size={16} className='text-white/40' />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Cerca per parola chiave (es. kitchen, fitness, gadget)...'
          className='w-full bg-transparent text-sm outline-none placeholder:text-white/30'
        />
        <button type='submit' className='rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark'>
          Cerca
        </button>
      </form>

      {note ? <div className='text-xs text-white/40'>{note}</div> : null}

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-white/40'>
          <Loader2 className='animate-spin' />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {products.map((p) => (
            <div key={p.id} className='glass glass-hover flex flex-col p-4'>
              <div className='relative mb-3 grid h-32 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand/20 to-transparent text-5xl'>
                {p.image && p.image.startsWith('http') ? (
                  <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                ) : (
                  <span>{p.image || '📦'}</span>
                )}
                <span className='absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white'>
                  {p.score}
                </span>
              </div>
              <div className='mb-1 text-xs text-brand'>{p.label}</div>
              <h3 className='line-clamp-2 text-sm font-medium leading-snug'>{p.name}</h3>
              <div className='mt-1 text-xs text-white/40'>{p.category}</div>
              <div className='mt-3 flex items-end justify-between'>
                <div>
                  <div className='text-xs text-white/40'>costo €{p.cost}</div>
                  <div className='text-lg font-semibold'>€{p.suggestedPrice}</div>
                </div>
                <div className='text-right text-xs text-emerald-400'>{p.margin}% margine</div>
              </div>
              <div className='mt-2 text-[11px] text-white/40'>
                Competitor (stima): €{p.competitorLow} – €{p.competitorHigh}
              </div>
              <button
                onClick={() => importProduct(p)}
                disabled={imported[p.id]}
                className='mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand/15 py-2 text-xs text-white transition hover:bg-brand/25 disabled:opacity-60'
              >
                {imported[p.id] ? (
                  <>
                    <Check size={14} /> Importato
                  </>
                ) : (
                  <>
                    <Download size={14} /> Importa
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
