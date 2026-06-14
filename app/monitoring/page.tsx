'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/lib/types'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function MonitoringPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((res) => {
        setProducts((res && res.data) || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Monitoraggio</h1>
        <p className='text-sm text-white/50'>Prezzi e disponibilità in tempo reale</p>
      </header>
      <div className='glass p-5'>
        <div className='mb-4 flex items-center gap-2 text-sm text-white/60'>
          <Activity size={16} className='text-brand' /> Controllo automatico ogni 6 ore
        </div>
        {loading ? (
          <p className='py-10 text-center text-sm text-white/40'>Caricamento...</p>
        ) : products.length === 0 ? (
          <p className='py-10 text-center text-sm text-white/40'>Nessun prodotto da monitorare. Importa prodotti reali per attivare il controllo automatico.</p>
        ) : (
          <ul className='space-y-2'>
            {products.map((p) => {
              const low = p.stock < 50
              return (
                <li key={p.id} className='flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3'>
                  <span className='grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5 text-2xl'>
                    {p.image && p.image.indexOf('http') === 0 ? (
                      <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                    ) : (
                      <span>{p.image || '📦'}</span>
                    )}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm'>{p.name}</div>
                    <div className='text-xs text-white/40'>{p.supplier} · €{p.cost}</div>
                  </div>
                  <div className='text-right text-xs'>
                    <div className='text-white/60'>{p.stock} pz</div>
                    {low ? (
                      <span className='flex items-center gap-1 text-amber-400'>
                        <AlertTriangle size={12} /> stock basso
                      </span>
                    ) : (
                      <span className='flex items-center gap-1 text-emerald-400'>
                        <CheckCircle2 size={12} /> ok
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
