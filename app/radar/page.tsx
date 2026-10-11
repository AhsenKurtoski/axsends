'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radar, Loader2, RefreshCw, Flame, Sparkles } from 'lucide-react'

type Product = {
  id: string
  name: string
  image: string
  category: string
  cost: number
  suggestedPrice: number
  margin: number
  profit: number
  score: number
  label: string
  popularity: number
}

export default function RadarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [note, setNote] = useState('')
  const [scannedAt, setScannedAt] = useState('')

  async function scan() {
    setLoading(true)
    try {
      const res = await fetch('/api/radar?t=' + Date.now())
      const data = await res.json()
      setProducts(data.products || [])
      setNote(data.note || '')
      setScannedAt(data.scannedAt || '')
    } catch (err) {
      setNote('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    scan()
  }, [])

  function genAd(p: Product) {
    router.push('/ads?product=' + encodeURIComponent(p.name))
  }

  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <Radar className='text-brand' size={22} /> Radar prodotti vincenti AhsenDS
          </h1>
          <p className='text-sm text-white/50'>Scansione automatica multi-nicchia, ordinata per potenziale &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs text-brand-light'>
            Costruito da <strong className='text-white'>Ahsen Kurtoski</strong>
          </span>
          <button
            onClick={scan}
            disabled={loading}
            className='flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60'
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Scansiona ora
          </button>
        </div>
      </header>

      {note ? (
        <div className='text-xs text-white/40'>
          {note}
          {scannedAt ? ' - ' + new Date(scannedAt).toLocaleString('it-IT') : ''}
        </div>
      ) : null}

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-5 text-white/40'>
          <Loader2 className='animate-spin' />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {products.map((p, i) => (
            <div key={p.id} className='glass glass-hover flex flex-col p-4'>
              <div className='relative mb-3 grid h-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand/20 to-transparent text-5xl'>
                {p.image && p.image.startsWith('http') ? (
                  <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                ) : (
                  <span>{p.image || '📦'}</span>
                )}
                <span className='absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white'>
                  #{i + 1}
                </span>
                <span className='absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-orange-400'>
                  <Flame size={12} /> {p.score}
                </span>
              </div>
              <div className='mb-1 text-xs text-brand'>{p.label}</div>
              <h3 className='line-clamp-2 text-sm font-medium leading-snug'>{p.name}</h3>
              <div className='mt-1 text-xs text-white/40'>{p.category}</div>
              <div className='mt-3 flex items-end justify-between'>
                <div className='text-lg font-semibold'>€{p.suggestedPrice}</div>
                <div className='text-right text-xs text-emerald-400'>+€{p.profit} / vendita</div>
              </div>
              <button
                onClick={() => genAd(p)}
                className='mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-xs text-white transition hover:bg-brand-dark'
              >
                <Sparkles size={14} /> Genera ad
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
