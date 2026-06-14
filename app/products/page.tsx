'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import type { Product } from '@/lib/types'
import { Search, Package, Rocket } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        setProducts((res && res.data) || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Prodotti</h1>
        <p className='text-sm text-white/50'>{products.length} prodotti nel catalogo</p>
      </header>

      <div className='glass flex items-center gap-2 px-4 py-2.5'>
        <Search size={16} className='text-white/40' />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Cerca prodotti...'
          className='w-full bg-transparent text-sm outline-none placeholder:text-white/30'
        />
      </div>

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-8 text-sm text-white/40'>Caricamento...</div>
      ) : products.length === 0 ? (
        <div className='glass grid min-h-[260px] place-items-center p-8 text-center'>
          <div className='max-w-md space-y-4'>
            <div className='mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand'>
              <Package size={26} />
            </div>
            <h2 className='text-lg font-medium'>Catalogo vuoto</h2>
            <p className='text-sm text-white/50'>
              Trova prodotti reali nel Radar o nella Ricerca e importali. I prodotti salvati appariranno qui (richiede Supabase).
            </p>
            <Link href='/radar' className='inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'>
              <Rocket size={16} /> Vai al Radar
            </Link>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filtered.map((p) => {
            const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0
            return (
              <div key={p.id} className='glass glass-hover overflow-hidden p-4'>
                <div className='mb-3 grid h-32 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand/20 to-transparent text-5xl'>
                  {p.image && p.image.indexOf('http') === 0 ? (
                    <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                  ) : (
                    <span>{p.image || '📦'}</span>
                  )}
                </div>
                <div className='flex items-start justify-between gap-2'>
                  <h3 className='text-sm font-medium leading-snug'>{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div className='mt-1 text-xs text-white/40'>{p.supplier}</div>
                <div className='mt-3 flex items-end justify-between'>
                  <div>
                    <div className='text-lg font-semibold'>€{p.price}</div>
                    <div className='text-xs text-white/40'>costo €{p.cost}</div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-emerald-400'>{margin}% margine</div>
                    <div className='text-xs text-white/40'>{p.stock} in stock</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
