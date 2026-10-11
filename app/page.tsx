'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import RevenueChart from '@/components/RevenueChart'
import type { Product, Order, PricePoint } from '@/lib/types'
import { DollarSign, ShoppingCart, Package, TrendingUp, Rocket, ShieldCheck, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/orders').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then((res) => {
      const p = res[0]
      const o = res[1]
      setProducts((p && p.data) || [])
      setOrders((o && o.data) || [])
      setLoading(false)
    })
  }, [])

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0)
  const activeProducts = products.filter((p) => p.status === 'active').length
  const avgMargin = products.length
    ? Math.round(products.reduce((s, p) => s + ((p.price - p.cost) / (p.price || 1)) * 100, 0) / products.length)
    : 0
  const top = products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4)
  const recent = orders.slice(0, 5)

  const byDate: Record<string, number> = {}
  orders.forEach((o) => {
    byDate[o.date] = (byDate[o.date] || 0) + (o.total || 0)
  })
  const series: PricePoint[] = Object.keys(byDate)
    .sort()
    .map((d) => ({ date: d, revenue: byDate[d], cost: 0 }))

  const empty = !loading && products.length === 0 && orders.length === 0

  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>Dashboard AhsenDS</h1>
          <p className='text-sm text-white/50'>Panoramica del tuo business dropshipping &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs text-brand-light self-start sm:self-auto'>
          <ShieldCheck size={14} className='text-brand' />
          <span>Costruito da <strong className='text-white'>Ahsen Kurtoski</strong></span>
        </div>
      </header>

      {/* Banner rapido di presentazione della piattaforma */}
      <div className='glass p-4 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/15 via-brand/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white font-bold'>
            <Sparkles size={20} />
          </div>
          <div>
            <div className='text-sm font-semibold text-white'>AhsenDS Automation Engine</div>
            <div className='text-xs text-white/60'>
              Software completo di automazione dropshipping e generazione contenuti con AI &bull; Progettato e costruito da <strong>Ahsen Kurtoski</strong>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2 self-end md:self-auto'>
          <Link
            href='/autopilot'
            className='inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-medium text-white transition hover:bg-brand-dark'
          >
            <Rocket size={14} /> Avvia Autopilot
          </Link>
        </div>
      </div>

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-8 text-sm text-white/40'>Caricamento...</div>
      ) : empty ? (
        <div className='glass grid min-h-[300px] place-items-center p-8 text-center'>
          <div className='max-w-md space-y-4'>
            <div className='mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand'>
              <Rocket size={26} />
            </div>
            <h2 className='text-lg font-medium'>Inizia da zero con AhsenDS</h2>
            <p className='text-xs font-semibold text-brand'>Costruito e sviluppato da Ahsen Kurtoski</p>
            <p className='text-sm text-white/50'>
              Collega CJ Dropshipping per trovare prodotti reali e Supabase per salvare catalogo e ordini. Poi parti dal Radar o dall Autopilot per scoprire e vendere i prodotti vincenti.
            </p>
            <Link href='/radar' className='inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'>
              <Rocket size={16} /> Apri il Radar prodotti
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard label='Ricavi (ordini)' value={'€ ' + revenue.toLocaleString('it-IT')} icon={DollarSign} />
            <StatCard label='Ordini' value={String(orders.length)} icon={ShoppingCart} />
            <StatCard label='Prodotti attivi' value={String(activeProducts)} icon={Package} />
            <StatCard label='Margine medio' value={avgMargin + '%'} icon={TrendingUp} />
          </section>

          <section className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='glass p-5 lg:col-span-2'>
              <h2 className='mb-4 font-medium'>Andamento ricavi</h2>
              {series.length > 0 ? (
                <RevenueChart data={series} />
              ) : (
                <p className='py-10 text-center text-sm text-white/40'>Nessun ordine ancora registrato.</p>
              )}
            </div>
            <div className='glass p-5'>
              <h2 className='mb-4 font-medium'>Top prodotti</h2>
              {top.length > 0 ? (
                <ul className='space-y-3'>
                  {top.map((p) => (
                    <li key={p.id} className='flex items-center gap-3'>
                      <span className='grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5 text-xl'>
                        {p.image && p.image.indexOf('http') === 0 ? (
                          <img src={p.image} alt={p.name} className='h-full w-full object-cover' />
                        ) : (
                          <span>{p.image || '📦'}</span>
                        )}
                      </span>
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium'>{p.name}</div>
                        <div className='text-xs text-white/40'>{p.sold} venduti &bull; €{p.price}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='py-10 text-center text-sm text-white/40'>Nessun prodotto venduto ancora.</p>
              )}
            </div>
          </section>

          <section className='glass p-5'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-medium'>Ultimi ordini</h2>
              <Link href='/orders' className='text-xs text-brand hover:underline'>Tutti gli ordini &rarr;</Link>
            </div>
            {recent.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-left text-white/40'>
                      <th className='pb-3 font-normal'>Ordine</th>
                      <th className='pb-3 font-normal'>Prodotto</th>
                      <th className='pb-3 font-normal'>Cliente</th>
                      <th className='pb-3 font-normal'>Totale</th>
                      <th className='pb-3 font-normal'>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id} className='border-t border-white/5'>
                        <td className='py-3 text-white/70'>{o.id}</td>
                        <td className='py-3'>{o.product}</td>
                        <td className='py-3 text-white/70'>{o.customer}</td>
                        <td className='py-3'>€{o.total}</td>
                        <td className='py-3'><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-sm text-white/40'>Nessun ordine ancora.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
