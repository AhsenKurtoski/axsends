'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Activity,
} from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Prodotti', icon: Package },
  { href: '/orders', label: 'Ordini', icon: ShoppingCart },
  { href: '/suppliers', label: 'Fornitori', icon: Truck },
  { href: '/monitoring', label: 'Monitoraggio', icon: Activity },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className='glass m-3 w-64 shrink-0 p-5 hidden md:flex flex-col gap-2 sticky top-3 h-[calc(100vh-1.5rem)]'>
      <div className='mb-6 flex items-center gap-3 px-2'>
        <div className='grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white shadow-glass'>
          A
        </div>
        <div>
          <div className='text-lg font-semibold leading-tight'>AxsenDS</div>
          <div className='text-xs text-white/40'>Dropshipping OS</div>
        </div>
      </div>
      <nav className='flex flex-col gap-1'>
        {nav.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ' +
                (active
                  ? 'bg-brand/20 text-white border border-brand/40'
                  : 'text-white/60 hover:bg-white/5 hover:text-white')
              }
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className='mt-auto glass p-3 text-xs text-white/50'>
        <div className='font-medium text-white/70'>Modalità demo</div>
        Aggiungi le chiavi Supabase per i dati reali.
      </div>
    </aside>
  )
}
