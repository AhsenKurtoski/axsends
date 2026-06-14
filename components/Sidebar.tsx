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
  Sparkles,
  Rocket,
  TrendingUp,
  Tag,
  Radar,
  Zap,
  DollarSign,
  Megaphone,
  CalendarClock,
  Wallet,
  Store,
  BookOpen,
  Clapperboard,
  CalendarDays,
  Globe,
  Shirt,
  Settings,
} from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/money', label: 'Centro guadagni', icon: Wallet },
  { href: '/radar', label: 'Radar vincenti', icon: Radar },
  { href: '/research', label: 'Ricerca prodotti', icon: Rocket },
  { href: '/trends', label: 'Trend virali', icon: TrendingUp },
  { href: '/automation', label: 'Automazioni', icon: Zap },
  { href: '/products', label: 'Prodotti', icon: Package },
  { href: '/pricing', label: 'Regole prezzo', icon: Tag },
  { href: '/orders', label: 'Ordini', icon: ShoppingCart },
  { href: '/suppliers', label: 'Fornitori', icon: Truck },
  { href: '/monitoring', label: 'Monitoraggio', icon: Activity },
  { href: '/ads', label: 'AI Ads', icon: Sparkles },
  { href: '/auto-ads', label: 'Ads automatiche', icon: Megaphone },
  { href: '/calendar', label: 'Calendario', icon: CalendarDays },
  { href: '/queue', label: 'Coda', icon: CalendarClock },
  { href: '/store', label: 'Negozio AI', icon: Store },
  { href: '/digital', label: 'Prodotti digitali', icon: BookOpen },
  { href: '/ugc', label: 'UGC Studio', icon: Clapperboard },
  { href: '/website', label: 'Web Studio', icon: Globe },
  { href: '/pod', label: 'Print on Demand', icon: Shirt },
  { href: '/affiliate', label: 'Affiliate', icon: DollarSign },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Stato AI e chiavi', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className='glass m-3 w-64 shrink-0 p-5 hidden md:flex flex-col gap-2 sticky top-3 h-[calc(100vh-1.5rem)] overflow-y-auto'>
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
        <div className='font-medium text-white/70'>Dati reali</div>
        Aggiungi le chiavi (CJ, Supabase, AI) in .env.local per attivare tutto.
      </div>
    </aside>
  )
}
