import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import RevenueChart from '@/components/RevenueChart'
import { products, orders, revenueSeries, stats } from '@/lib/mockData'
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const recent = orders.slice(0, 5)
  const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4)
  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Dashboard</h1>
        <p className='text-sm text-white/50'>Panoramica del tuo business dropshipping</p>
      </header>

      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Ricavi (mese)' value={'€ ' + stats.revenue.toLocaleString('it-IT')} delta='+18%' icon={DollarSign} />
        <StatCard label='Ordini' value={String(stats.orders)} delta='+12%' icon={ShoppingCart} />
        <StatCard label='Prodotti attivi' value={String(stats.activeProducts)} delta='+4%' icon={Package} />
        <StatCard label='Margine medio' value={stats.avgMargin + '%'} delta='+2%' icon={TrendingUp} />
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='glass p-5 lg:col-span-2'>
          <h2 className='mb-4 font-medium'>Andamento ricavi</h2>
          <RevenueChart data={revenueSeries} />
        </div>
        <div className='glass p-5'>
          <h2 className='mb-4 font-medium'>Top prodotti</h2>
          <ul className='space-y-3'>
            {top.map((p) => (
              <li key={p.id} className='flex items-center gap-3'>
                <span className='grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-xl'>{p.image}</span>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm'>{p.name}</div>
                  <div className='text-xs text-white/40'>{p.sold} venduti</div>
                </div>
                <span className='text-sm text-emerald-400'>€{p.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className='glass p-5'>
        <h2 className='mb-4 font-medium'>Ordini recenti</h2>
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
      </section>
    </div>
  )
}
