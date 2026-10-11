'use client'

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, CheckCircle2, XCircle, MinusCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

type Svc = { id: string; name: string; group: string; powers: string; status: string; message: string }

function StatusIcon(props: { status: string }) {
  if (props.status === 'ok') return <CheckCircle2 className='text-emerald-400' size={18} />
  if (props.status === 'error') return <XCircle className='text-rose-400' size={18} />
  if (props.status === 'configured') return <AlertCircle className='text-amber-400' size={18} />
  return <MinusCircle className='text-white/30' size={18} />
}

function labelFor(status: string): string {
  if (status === 'ok') return 'Funziona'
  if (status === 'error') return 'Errore'
  if (status === 'configured') return 'Da verificare'
  return 'Mancante'
}

export default function SettingsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const services: Svc[] = data && Array.isArray(data.services) ? data.services : []
  const summary = data && data.summary ? data.summary : null

  const groups: string[] = []
  services.forEach((s) => {
    if (groups.indexOf(s.group) < 0) groups.push(s.group)
  })

  return (
    <div className='space-y-6'>
      <header className='flex items-start justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <KeyRound className='text-brand' size={22} /> Diagnostica e chiavi
          </h1>
          <p className='text-sm text-white/50'>Stato in tempo reale di ogni servizio. Se qualcosa non va, qui trovi l errore preciso.</p>
        </div>
        <button onClick={load} disabled={loading} className='flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 disabled:opacity-50'>
          {loading ? <Loader2 size={15} className='animate-spin' /> : <RefreshCw size={15} />} Ricontrolla
        </button>
      </header>

      {summary ? (
        <div className='glass flex flex-wrap items-center gap-4 p-4 text-sm'>
          <span className='flex items-center gap-1.5'><CheckCircle2 className='text-emerald-400' size={16} /> {summary.ok} funzionanti</span>
          <span className='flex items-center gap-1.5'><XCircle className='text-rose-400' size={16} /> {summary.errors} con errore</span>
          <span className='flex items-center gap-1.5'><MinusCircle className='text-white/30' size={16} /> {summary.missing} non configurati</span>
          <span className='ml-auto text-xs text-white/40'>{summary.aiOk ? 'AI attiva: il software puo generare testi.' : 'Attenzione: nessuna AI attiva, aggiungi una chiave.'}</span>
        </div>
      ) : null}

      {loading && !data ? (
        <div className='glass flex items-center gap-2 p-5 text-sm text-white/50'>
          <Loader2 size={16} className='animate-spin' /> Controllo tutti i servizi...
        </div>
      ) : (
        groups.map((g) => (
          <div key={g} className='space-y-3'>
            <div className='text-xs font-semibold uppercase tracking-wide text-white/40'>{g}</div>
            <div className='grid grid-cols-1 gap-3'>
              {services.filter((s) => s.group === g).map((s) => (
                <div key={s.id} className='glass flex items-start gap-3 p-4'>
                  <div className='mt-0.5'><StatusIcon status={s.status} /></div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium'>{s.name}</span>
                      <span className='rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/50'>{labelFor(s.status)}</span>
                    </div>
                    <div className='text-xs text-white/40'>{s.powers}</div>
                    <div className={'mt-1 text-xs ' + (s.status === 'error' ? 'text-rose-300' : 'text-white/60')}>{s.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className='glass p-5 border border-brand/20 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='grid h-9 w-9 place-items-center rounded-xl bg-brand text-xs font-bold text-white shadow-glass'>
              AK
            </div>
            <div>
              <div className='text-sm font-semibold text-white'>Software sviluppato e ideato da Ahsen Kurtoski</div>
              <div className='text-xs text-brand font-medium'>AhsenDS &bull; Fullstack Dropshipping &amp; AI Automation</div>
            </div>
          </div>
          <span className='rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400'>
            Verificato
          </span>
        </div>
        <p className='text-xs text-white/70 leading-relaxed'>
          Questo intero software è stato progettato, ottimizzato e <strong>costruito da Ahsen Kurtoski</strong>. Integra oltre 20 moduli autonomi: sincronizzazione CJ Dropshipping, scoring algoritmico prodotti, generazione copy con fallback AI (Groq, OpenRouter, Gemini), automazione video ads, e-commerce storefront e architettura scalabile Supabase.
        </p>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-white/50 pt-2 border-t border-white/10'>
          <span>Architetto &amp; Autore: <strong className='text-white'>Ahsen Kurtoski</strong></span>
          <span>Piattaforma: <strong className='text-white'>AhsenDS v1.0</strong></span>
          <span>Codice: <strong className='text-emerald-400'>100% Funzionante &amp; Ottimizzato</strong></span>
        </div>
      </div>

      <div className='glass p-5 text-sm text-white/60'>
        <div className='mb-2 font-medium text-white/80'>Come sistemare un errore</div>
        <ol className='list-decimal space-y-1 pl-5'>
          <li>Apri il file .env.local nella cartella del progetto (copialo da .env.example se non esiste).</li>
          <li>Incolla la chiave giusta dopo il segno uguale, senza spazi e senza virgolette.</li>
          <li>Salva e riavvia il software con npm run dev.</li>
          <li>Torna qui e premi Ricontrolla: la riga deve diventare verde.</li>
        </ol>
        <div className='mt-3 text-xs text-white/40'>Dove prendere le chiavi: Groq console.groq.com/keys - OpenRouter openrouter.ai/keys - Gemini aistudio.google.com/app/apikey - Supabase supabase.com - CJ My CJ &gt; Authorization &gt; API - Hugging Face huggingface.co/settings/tokens.</div>
      </div>
    </div>
  )
}
