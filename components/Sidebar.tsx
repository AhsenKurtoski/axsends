'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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
  Wand2,
  Settings,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/autopilot', label: 'Autopilot', icon: Wand2 },
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
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const configured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    if (!configured) {
      setLoading(false)
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )

    // Stato iniziale + ascolto dei cambi di sessione (login/logout da altro tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email || 'Utente' } : null)
      setLoading(false)
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { email: user.email || 'Utente' } : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return (
    <aside className='glass m-3 w-64 shrink-0 p-5 hidden md:flex flex-col gap-2 sticky top-3 h-[calc(100vh-1.5rem)] overflow-y-auto'>
      <div className='mb-4 flex items-center gap-3 px-2'>
        <div className='grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white shadow-glass'>
          A
        </div>
        <div className='min-w-0 flex-1'>
          <div className='text-lg font-semibold leading-tight tracking-tight text-white'>AhsenDS</div>
          <div className='text-[10px] font-medium text-brand truncate'>Costruito da Ahsen Kurtoski</div>
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

      <div className='mt-auto pt-3 flex flex-col gap-2'>
        {/* Badge sviluppatore Ahsen Kurtoski */}
        <div className='rounded-xl border border-brand/25 bg-gradient-to-r from-brand/15 to-transparent p-2.5'>
          <div className='flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand'>
            <ShieldCheck size={13} />
            <span>Creatore &amp; Sviluppatore</span>
          </div>
          <div className='text-xs font-semibold text-white mt-0.5'>Ahsen Kurtoski</div>
          <div className='text-[10px] text-white/50'>Architettura AhsenDS v1.0</div>
        </div>

        {configured ? (
          <>
            {user ? (
              <div className='glass p-3 space-y-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <User className='text-white/50' size={16} />
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium truncate'>{user.email}</div>
                    <div className='text-xs text-white/40'>Amministratore</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white'
                >
                  <LogOut size={14} /> Esci
                </button>
              </div>
            ) : loading ? (
              <div className='glass p-3 text-center text-xs text-white/40'>Caricamento utente...</div>
            ) : (
              <div className='glass p-3 space-y-2 text-center'>
                <p className='text-xs text-white/50'>Non autenticato</p>
                <Link
                  href='/login'
                  className='block w-full rounded-xl bg-brand/15 py-2 text-xs text-brand transition hover:bg-brand/25'
                >
                  Accedi
                </Link>
                <Link
                  href='/signup'
                  className='block w-full rounded-xl border border-white/10 py-2 text-xs text-white/60 transition hover:bg-white/5'
                >
                  Registrati
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className='glass p-3 text-xs text-white/50'>
            <div className='font-medium text-white/70'>Modalita Demo</div>
            Aggiungi le chiavi Supabase in .env.local per attivare l'autenticazione.
          </div>
        )}
      </div>
    </aside>
  )
}
