'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

type Auto = { id: string; label: string; desc: string; status: string }

const AUTOMATIONS: Auto[] = [
  { id: 'radar', label: 'Radar prodotti vincenti', desc: 'Scansione automatica multi-nicchia ogni giorno', status: 'Attivo' },
  { id: 'scoring', label: 'Punteggio potenziale', desc: 'Calcolo automatico 0-100 per ogni prodotto', status: 'Attivo' },
  { id: 'autoprice', label: 'Auto-prezzo', desc: 'Markup e margine minimo applicati agli import', status: 'Attivo' },
  { id: 'round99', label: 'Arrotondamento .99', desc: 'Prezzi psicologici automatici', status: 'Attivo' },
  { id: 'competitor', label: 'Analisi competitor', desc: 'Stima fascia prezzi dei concorrenti', status: 'Attivo' },
  { id: 'trends', label: 'Trend virali', desc: 'Classifica automatica per domanda', status: 'Attivo' },
  { id: 'caption', label: 'Caption + hashtag AI', desc: 'Testi social generati per ogni ad', status: 'Attivo' },
  { id: 'monitor', label: 'Monitoraggio prezzi', desc: 'Controllo automatico ogni 6 ore (cron)', status: 'Attivo' },
  { id: 'desc', label: 'Descrizione + SEO AI', desc: 'Schede prodotto generate automaticamente', status: 'Attivo' },
  { id: 'image', label: 'Creativo immagine AI', desc: 'Immagine pubblicitaria con Hugging Face', status: 'Richiede HF' },
  { id: 'video', label: 'Video ad AI', desc: 'Video pubblicitario con Hugging Face', status: 'Richiede HF' },
  { id: 'stock', label: 'Monitoraggio stock', desc: 'Avviso quando un prodotto sta finendo', status: 'Richiede CJ' },
  { id: 'fulfill', label: 'Auto-fulfillment ordini', desc: 'Preparazione automatica ordini verso CJ', status: 'Richiede CJ' },
  { id: 'autoimport', label: 'Import automatico winners', desc: 'Importa i top del radar nel catalogo', status: 'Richiede Supabase' },
  { id: 'report', label: 'Report giornaliero', desc: 'Riepilogo vendite e margini ogni giorno', status: 'Richiede Supabase' },
]

export default function AutomationPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let init: Record<string, boolean> = {}
    AUTOMATIONS.forEach((a) => {
      init[a.id] = true
    })
    try {
      const raw = localStorage.getItem('axsends_automation')
      if (raw) init = Object.assign(init, JSON.parse(raw))
    } catch (err) {
      // nessuna preferenza salvata
    }
    setEnabled(init)
  }, [])

  function toggle(id: string) {
    setEnabled((prev) => {
      const next = Object.assign({}, prev, { [id]: !prev[id] })
      try {
        localStorage.setItem('axsends_automation', JSON.stringify(next))
      } catch (err) {
        // localStorage non disponibile
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
      return next
    })
  }

  const activeCount = AUTOMATIONS.filter((a) => enabled[a.id]).length

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <Zap className='text-brand' size={22} /> Centro automazioni
        </h1>
        <p className='text-sm text-white/50'>
          {activeCount} di {AUTOMATIONS.length} automazioni attive{saved ? ' · salvato' : ''}
        </p>
      </header>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {AUTOMATIONS.map((a) => {
          const on = !!enabled[a.id]
          const live = a.status === 'Attivo'
          return (
            <div key={a.id} className='glass flex flex-col gap-3 p-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='text-sm font-medium'>{a.label}</div>
                <button
                  onClick={() => toggle(a.id)}
                  className={'relative h-6 w-11 shrink-0 rounded-full transition ' + (on ? 'bg-brand' : 'bg-white/15')}
                  aria-label='toggle'
                >
                  <span
                    className={
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ' +
                      (on ? 'left-[22px]' : 'left-0.5')
                    }
                  />
                </button>
              </div>
              <p className='text-xs text-white/50'>{a.desc}</p>
              <span
                className={
                  'mt-auto w-fit rounded-full px-2 py-0.5 text-[11px] ' +
                  (live ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400')
                }
              >
                {a.status}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
