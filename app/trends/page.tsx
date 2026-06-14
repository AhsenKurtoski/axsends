'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Loader2, Flame } from 'lucide-react'

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
}

export default function TrendsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    fetch('/api/research?sort=trending')
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || [])
        setNote(d.note || '')
      })
      .catch(() => setNote('Errore di rete'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <TrendingUp className='text-brand' size={22} /> Trend virali
        </h1>
        <p className='text-sm text-white/50'>Prodotti più richiesti, ordinati per domanda</p>
      </header>

      {note ? <div className='text-xs text-white/40'>{note}</div> : null}

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-white/40'>
          <Loader2 className='animate-spin' />
        </div>
      ) : (
        <div className='glass divide-y divide-white/5'>
          {products.map((p, i) => (
            <div key={p.id} className='flex items-center gap-4 p-4'>
              <div className='w-6 text-center text-sm font-semibold text-white/40'>{i + 1}</div>
              <div className='grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand/15 text-2xl'>
                {p.image && p.image.startsWith('http') ? (
                  <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                ) : (
                  <span>{p.image || '📦'}</span>
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='truncate text-sm font-medium'>{p.name}</div>
                <div className='text-xs text-white/40'>
                  {p.category} · {p.popularity.toLocaleString()} segnali di domanda
                </div>
              </div>
              <div className='flex items-center gap-1 text-xs text-orange-400'>
                <Flame size={14} /> {p.score}
              </div>
              <div className='hidden text-right text-sm font-semibold sm:block'>€{p.suggestedPrice}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
