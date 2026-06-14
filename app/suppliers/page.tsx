import { suppliers } from '@/lib/mockData'
import { Star, Truck } from 'lucide-react'

export default function SuppliersPage() {
  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Fornitori</h1>
        <p className='text-sm text-white/50'>I tuoi fornitori collegati</p>
      </header>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {suppliers.map((s) => (
          <div key={s.id} className='glass glass-hover p-5'>
            <div className='flex items-center gap-3'>
              <span className='grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand'>
                <Truck size={20} />
              </span>
              <div>
                <div className='font-medium'>{s.name}</div>
                <div className='text-xs text-white/40'>{s.country}</div>
              </div>
            </div>
            <div className='mt-4 grid grid-cols-3 gap-2 text-center'>
              <div className='glass p-2'>
                <div className='text-sm font-semibold'>{s.products}</div>
                <div className='text-[10px] text-white/40'>prodotti</div>
              </div>
              <div className='glass p-2'>
                <div className='flex items-center justify-center gap-1 text-sm font-semibold'>
                  <Star size={12} className='text-amber-400' /> {s.rating}
                </div>
                <div className='text-[10px] text-white/40'>rating</div>
              </div>
              <div className='glass p-2'>
                <div className='text-sm font-semibold'>{s.avgShipping}</div>
                <div className='text-[10px] text-white/40'>spedizione</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
