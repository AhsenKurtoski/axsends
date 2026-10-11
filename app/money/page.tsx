'use client'

import Link from 'next/link'
import { Wallet, Radar, DollarSign, Store, BookOpen, Clapperboard, Globe, Shirt } from 'lucide-react'

const MODES = [
  { href: '/radar', icon: Radar, title: 'Dropshipping', desc: 'Trova prodotti vincenti e vendili col tuo margine.', tag: 'Attivo' },
  { href: '/affiliate', icon: DollarSign, title: 'Affiliate + 17 metodi', desc: 'Link Amazon automatici e 17 modi per guadagnare.', tag: 'Attivo' },
  { href: '/store', icon: Store, title: 'Negozio AI', desc: 'Landing che vende + raccolta ordini. Vendita diretta.', tag: 'Nuovo' },
  { href: '/digital', icon: BookOpen, title: 'Prodotti digitali', desc: 'Crea e vendi ebook reali. Margine quasi 100%.', tag: 'Nuovo' },
  { href: '/ugc', icon: Clapperboard, title: 'UGC Studio', desc: 'Vendi video ai brand: 50-150 EUR a video.', tag: 'Nuovo' },
  { href: '/website', icon: Globe, title: 'Web Studio', desc: 'L AI crea siti premium da vendere ai locali (200-500 EUR).', tag: 'Nuovo' },
  { href: '/pod', icon: Shirt, title: 'Print on Demand', desc: 'Design AI su Redbubble/Etsy. Zero magazzino.', tag: 'Nuovo' },
]

export default function MoneyPage() {
  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <Wallet className='text-brand' size={22} /> Centro guadagni AhsenDS
          </h1>
          <p className='text-sm text-white/50'>Tutti i tuoi modi di fare soldi in un unico posto &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs text-brand-light self-start sm:self-auto'>
          <span>Costruito da <strong className='text-white'>Ahsen Kurtoski</strong></span>
        </div>
      </header>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {MODES.map((m) => {
          const Icon = m.icon
          return (
            <Link key={m.href} href={m.href} className='glass glass-hover flex flex-col gap-3 p-5'>
              <div className='flex items-center justify-between'>
                <div className='grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand'>
                  <Icon size={20} />
                </div>
                <span className='rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400'>{m.tag}</span>
              </div>
              <div className='text-sm font-medium'>{m.title}</div>
              <p className='text-xs text-white/50'>{m.desc}</p>
            </Link>
          )
        })}
      </div>

      <p className='text-xs text-white/30'>Nota onesta: nessun metodo garantisce guadagni automatici. Questi sono strumenti veri che aumentano le tue possibilita; i risultati dipendono dal tuo lavoro e dal mercato.</p>
    </div>
  )
}
