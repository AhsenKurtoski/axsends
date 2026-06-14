import RevenueChart from '@/components/RevenueChart'
import StatCard from '@/components/StatCard'
import { revenueSeries, stats, products } from '@/lib/mockData'
import { DollarSign, TrendingUp, Percent, Package } from 'lucide-react'

export default function AnalyticsPage() {
  const totalCost = revenueSeries.reduce((s, p) => s + p.cost, 0)
  const totalRevenue = revenueSeries.reduce((s, p) => s + p.revenue, 0)
  const profit = totalRevenue - totalCost
  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Analytics</h1>
        <p className='text-sm text-white/50'>Margini e performance</p>
      </header>
      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard label='Ricavi totali' value={'€ ' + totalRevenue.toLocaleString('it-IT')} icon={DollarSign} />
        <StatCard label='Profitto' value={'€ ' + profit.toLocaleString('it-IT')} delta='+21%' icon={TrendingUp} />
        <StatCard label='Margine medio' value={stats.avgMargin + '%'} icon={Percent} />
        <StatCard label='Prodotti' value={String(products.length)} icon={Package} />
      </section>
      <div className='glass p-5'>
        <h2 className='mb-4 font-medium'>Ricavi vs Costi</h2>
        <RevenueChart data={revenueSeries} />
      </div>
    </div>
  )
}
