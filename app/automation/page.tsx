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
  { id: 'monitor', label: 'Monitoraggio prezzi', desc: 'Controllo automatico ogni 6 ore (cron)', status: 'Attivo' },
  { id: 'besttime', label: 'Orari migliori per postare', desc: 'Suggerisce le fasce orarie con piu engagement', status: 'Attivo' },
  { id: 'desc', label: 'Descrizione + SEO AI', desc: 'Schede prodotto scritte dall AI, niente template', status: 'Richiede AI' },
  { id: 'caption', label: 'Caption + hashtag AI', desc: 'Testi social generati dall AI per ogni ad', status: 'Richiede AI' },
  { id: 'affiliate', label: 'Contenuti affiliate AI', desc: 'Post e disclosure scritti dall AI', status: 'Richiede AI' },
  { id: 'autoads', label: 'Ads auto multi-prodotto', desc: 'TikTok + YouTube generate dall AI per ogni prodotto con potenziale', status: 'Richiede AI' },
  { id: 'aicopy', label: 'Copywriting AI (Groq/Gemini)', desc: 'Tutti i testi scritti dall AI, mai template fissi', status: 'Richiede AI' },
  { id: 'seo', label: 'Tag SEO automatici', desc: 'Parole chiave generate dall AI per ogni scheda', status: 'Richiede AI' },
  { id: 'abtest', label: 'A/B test creativi AI', desc: 'Piu varianti di hook per testare cosa converte di piu', status: 'Richiede AI' },
  { id: 'hashtagopt', label: 'Ottimizzatore hashtag', desc: 'Mix di hashtag virali e di nicchia generati dall AI', status: 'Richiede AI' },
  { id: 'image', label: 'Creativo immagine AI', desc: 'Immagine pubblicitaria con Hugging Face', status: 'Richiede HF' },
  { id: 'video', label: 'Video ad AI', desc: 'Video pubblicitario con Hugging Face', status: 'Richiede HF' },
  { id: 'facebook', label: 'Pubblicazione Facebook', desc: 'Post e video pubblicati sulla tua Pagina Facebook', status: 'Richiede Facebook' },
  { id: 'instagram', label: 'Pubblicazione Instagram', desc: 'Reels e post pubblicati sul tuo account Instagram', status: 'Richiede Instagram' },
  { id: 'tiktok', label: 'Upload TikTok', desc: 'Pubblica i video sul tuo account TikTok', status: 'Richiede TikTok' },
  { id: 'tiktokshop', label: 'TikTok Shop', desc: 'Sincronizza i prodotti con TikTok Shop', status: 'Richiede TikTok' },
  { id: 'youtube', label: 'Upload YouTube', desc: 'Carica Shorts e video sul tuo canale', status: 'Richiede YouTube' },
  { id: 'publishall', label: 'Pubblica ovunque', desc: 'Stesso video su Facebook, Instagram, TikTok e YouTube in un clic', status: 'Richiede social' },
  { id: 'queue', label: 'Coda di pubblicazione', desc: 'Salva, pianifica e ritrova le ads generate', status: 'Richiede Supabase' },
  { id: 'scheduler', label: 'Pianificazione oraria', desc: 'Programma le ads della coda con data e ora', status: 'Richiede Supabase' },
  { id: 'stock', label: 'Monitoraggio stock', desc: 'Avviso quando un prodotto sta finendo', status: 'Richiede CJ' },
  { id: 'fulfill', label: 'Auto-fulfillment ordini', desc: 'Preparazione automatica ordini verso CJ', status: 'Richiede CJ' },
  { id: 'reprice', label: 'Riprezzo dinamico', desc: 'Adegua markup e margine se il costo CJ cambia', status: 'Richiede CJ' },
  { id: 'autoimport', label: 'Import automatico winners', desc: 'Importa i top del radar nel catalogo', status: 'Richiede Supabase' },
  { id: 'roi', label: 'Tracker profitti e ROI', desc: 'Calcolo automatico di margine e ritorno per prodotto', status: 'Richiede Supabase' },
  { id: 'report', label: 'Report giornaliero', desc: 'Riepilogo vendite e margini ogni giorno', status: 'Richiede Supabase' },
  { id: 'amazonaff', label: 'Link affiliati Amazon', desc: 'Genera link Amazon col tuo tag Associates in automatico', status: 'Attivo' },
  { id: 'bundles', label: 'Bundle e kit prodotti', desc: 'Suggerisce abbinamenti per alzare lo scontrino medio', status: 'Richiede AI' },
  { id: 'upsell', label: 'Upsell e cross-sell', desc: 'Propone prodotti correlati per ogni acquisto', status: 'Richiede AI' },
  { id: 'emailflow', label: 'Email e DM di recupero', desc: 'Messaggi automatici per carrelli e clienti', status: 'Richiede AI' },
  { id: 'ugc', label: 'Script UGC per brand', desc: 'Genera script video da vendere come UGC creator', status: 'Richiede AI' },
  { id: 'pod', label: 'Print on demand', desc: 'Idee grafiche e copy per magliette e poster', status: 'Richiede AI' },
  { id: 'multilang', label: 'Traduzione multilingua', desc: 'Schede e ads tradotte dall AI per nuovi mercati', status: 'Richiede AI' },
  { id: 'calendar', label: 'Calendario contenuti', desc: 'Piano editoriale settimanale generato dall AI', status: 'Richiede AI' },
  { id: 'niche', label: 'Scout di nicchie', desc: 'Trova nicchie con domanda e poca concorrenza', status: 'Richiede AI' },
  { id: 'reviews', label: 'FAQ e recensioni AI', desc: 'Genera FAQ e risposte per la scheda prodotto', status: 'Richiede AI' },
  { id: 'thumbnail', label: 'Titoli e copertine virali', desc: 'Idee di titoli e thumbnail ottimizzate dall AI', status: 'Richiede AI' },
  { id: 'trendalert', label: 'Alert trend TikTok', desc: 'Segnala prodotti che stanno esplodendo ora', status: 'Attivo' },
  { id: 'pricewatch', label: 'Watcher prezzi competitor', desc: 'Confronta i tuoi prezzi con la fascia di mercato', status: 'Attivo' },
  { id: 'lowmargin', label: 'Margine basso intelligente', desc: 'Prezzi col +15-30% per vendere di piu sul volume', status: 'Attivo' },
  { id: 'kpigoal', label: 'KPI e obiettivo mensile', desc: 'Traccia l avanzamento verso il tuo obiettivo di guadagno', status: 'Richiede Supabase' },
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
          {activeCount} di {AUTOMATIONS.length} automazioni attive{saved ? ' - salvato' : ''}
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
