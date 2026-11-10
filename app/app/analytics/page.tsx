'use client'

import { useEffect, useState } from 'react'
import RevenueChart from '@/components/RevenueChart'
import StatCard from '@/components/StatCard'
import type { Product, Order, PricePoint } from '@/lib/types'
import { DollarSign, ShoppingCart, Percent, Package } from 'lucide-react'

export default function AnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/orders').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then((res) => {
      setProducts((res[0] && res[0].data) || [])
      setOrders((res[1] && res[1].data) || [])
      setLoading(false)
    })
  }, [])

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
  const avgMargin = products.length
    ? Math.round(products.reduce((s, p) => s + ((p.price - p.cost) / (p.price || 1)) * 100, 0) / products.length)
    : 0

  const byDate: Record<string, number> = {}
  orders.forEach((o) => {
    byDate[o.date] = (byDate[o.date] || 0) + (o.total || 0)
  })
  const series: PricePoint[] = Object.keys(byDate)
    .sort()
    .map((d) => ({ date: d, revenue: byDate[d], cost: 0 }))

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Analytics</h1>
        <p className='text-sm text-white/50'>Margini e performance</p>
      </header>

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-8 text-sm text-white/40'>Caricamento...</div>
      ) : (
        <>
          <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard label='Ricavi totali' value={'€ ' + totalRevenue.toLocaleString('it-IT')} icon={DollarSign} />
            <StatCard label='Ordini' value={String(orders.length)} icon={ShoppingCart} />
            <StatCard label='Margine medio' value={avgMargin + '%'} icon={Percent} />
            <StatCard label='Prodotti' value={String(products.length)} icon={Package} />
          </section>
          <div className='glass p-5'>
            <h2 className='mb-4 font-medium'>Ricavi per data</h2>
            {series.length > 0 ? (
              <RevenueChart data={series} />
            ) : (
              <p className='py-10 text-center text-sm text-white/40'>Nessun dato di vendita ancora. Le metriche si popolano con gli ordini reali.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
