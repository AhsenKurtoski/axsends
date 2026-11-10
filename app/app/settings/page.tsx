'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  Loader2,
  MinusCircle,
  RefreshCw,
  Wrench,
  XCircle,
} from 'lucide-react'

type HealthStatus = 'ok' | 'error' | 'missing' | 'configured'

type Service = {
  id: string
  name: string
  group: string
  powers: string
  status: HealthStatus
  message: string
  fix?: { env: string[]; hint?: string }
}

type Report = {
  app: string
  generatedAt: string
  aiOk: boolean
  summary: { total: number; ok: number; missing: number; error: number; configured: number }
  envFile: { exists: boolean; path: string; fromSystemEnv: boolean }
  services: Service[]
}

type TableCheck = { table: string; ok: boolean; message: string }
type FixResult = { ok: boolean; checked: number; missing: number; tables: TableCheck[]; note: string }

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === 'ok') return <CheckCircle2 className='text-emerald-400' size={18} />
  if (status === 'error') return <XCircle className='text-rose-400' size={18} />
  if (status === 'configured') return <AlertCircle className='text-amber-400' size={18} />
  return <MinusCircle className='text-white/30' size={18} />
}

function labelFor(status: HealthStatus): string {
  if (status === 'ok') return 'Funziona'
  if (status === 'error') return 'Errore'
  if (status === 'configured') return 'Da verificare'
  return 'Mancante'
}

function badgeClass(status: HealthStatus): string {
  if (status === 'ok') return 'bg-emerald-500/15 text-emerald-400'
  if (status === 'error') return 'bg-rose-500/15 text-rose-400'
  if (status === 'configured') return 'bg-amber-500/15 text-amber-400'
  return 'bg-white/5 text-white/50'
}

export default function DiagnosticsPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [fix, setFix] = useState<FixResult | null>(null)
  const [fixError, setFixError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setReport(null)
        setError((data && data.error) || 'Diagnostica non disponibile (HTTP ' + res.status + ').')
        return
      }
      setReport(data)
    } catch (err) {
      setReport(null)
      setError('Errore di rete: impossibile raggiungere /api/health.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function checkTables() {
    setFixLoading(true)
    setFixError(null)
    setFix(null)
    try {
      const res = await fetch('/api/health/fix', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFixError((data && data.error) || 'Verifica non riuscita (HTTP ' + res.status + ').')
        return
      }
      setFix(data)
    } catch (err) {
      setFixError('Errore di rete durante la verifica delle tabelle.')
    } finally {
      setFixLoading(false)
    }
  }

  const services: Service[] = report && Array.isArray(report.services) ? report.services : []
  const summary = report ? report.summary : null
  const groups: string[] = []
  services.forEach((s) => {
    if (groups.indexOf(s.group) < 0) groups.push(s.group)
  })

  const missingEnv = services
    .filter((s) => s.status === 'missing' && s.fix)
    .flatMap((s) => (s.fix ? s.fix.env : []))
  const uniqueMissingEnv = missingEnv.filter((v, i) => missingEnv.indexOf(v) === i)

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <KeyRound className='text-brand' size={22} /> Diagnostica
          </h1>
          <p className='text-sm text-white/50'>
            Verifica in tempo reale di ogni servizio collegato. Nessun valore simulato: se manca una
            chiave lo vedi qui, con il nome esatto della variabile da impostare.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className='flex shrink-0 items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 disabled:opacity-50'
        >
          {loading ? <Loader2 size={15} className='animate-spin' /> : <RefreshCw size={15} />} Ricontrolla
        </button>
      </header>

      {error ? (
        <div className='glass border border-rose-500/30 p-4 text-sm text-rose-300'>{error}</div>
      ) : null}

      {summary ? (
        <div className='glass grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-4'>
          <div className='flex items-center gap-1.5'>
            <CheckCircle2 className='text-emerald-400' size={16} /> {summary.ok} funzionanti
          </div>
          <div className='flex items-center gap-1.5'>
            <AlertCircle className='text-amber-400' size={16} /> {summary.configured} da verificare
          </div>
          <div className='flex items-center gap-1.5'>
            <XCircle className='text-rose-400' size={16} /> {summary.error} con errore
          </div>
          <div className='flex items-center gap-1.5'>
            <MinusCircle className='text-white/30' size={16} /> {summary.missing} non configurati
          </div>
          <div className='col-span-2 border-t border-white/5 pt-3 text-xs text-white/40 sm:col-span-4'>
            {report && report.envFile.exists
              ? 'File di ambiente trovato: ' + report.envFile.path
              : report && report.envFile.fromSystemEnv
                ? 'Nessun .env.local: le chiavi attive sono lette dalle variabili d ambiente del sistema.'
                : 'Nessun file di ambiente trovato: copia .env.example in ' + (report ? report.envFile.path : '.env.local')}
            {' · '}
            {report && report.aiOk ? 'AI attiva: i testi vengono generati.' : 'Nessuna AI attiva: aggiungi una chiave per generare i testi.'}
            {report ? ' · Controllato alle ' + new Date(report.generatedAt).toLocaleTimeString('it-IT') : ''}
          </div>
        </div>
      ) : null}

      {loading && !report ? (
        <div className='glass flex items-center gap-2 p-5 text-sm text-white/50'>
          <Loader2 size={16} className='animate-spin' /> Controllo tutti i servizi...
        </div>
      ) : (
        groups.map((g) => (
          <div key={g} className='space-y-3'>
            <div className='text-xs font-semibold uppercase tracking-wide text-white/40'>{g}</div>
            <div className='grid grid-cols-1 gap-3'>
              {services
                .filter((s) => s.group === g)
                .map((s) => (
                  <div key={s.id} className='glass flex items-start gap-3 p-4'>
                    <div className='mt-0.5'>
                      <StatusIcon status={s.status} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-medium'>{s.name}</span>
                        <span className={'rounded-full px-2 py-0.5 text-[11px] ' + badgeClass(s.status)}>
                          {labelFor(s.status)}
                        </span>
                      </div>
                      <div className='text-xs text-white/40'>{s.powers}</div>
                      <div className={'mt-1 text-xs ' + (s.status === 'error' ? 'text-rose-300' : 'text-white/60')}>
                        {s.message}
                      </div>
                      {s.fix ? (
                        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                          {s.fix.env.map((v) => (
                            <code key={v} className='rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-brand-light'>
                              {v}
                            </code>
                          ))}
                          {s.fix.hint ? <span className='text-[11px] text-white/30'>{s.fix.hint}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      <div className='glass space-y-3 p-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2 text-sm font-medium'>
            <Database size={16} className='text-brand' /> Verifica tabelle del database
          </div>
          <button
            onClick={checkTables}
            disabled={fixLoading}
            className='flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs text-white transition hover:bg-brand/20 disabled:opacity-50'
          >
            {fixLoading ? <Loader2 size={14} className='animate-spin' /> : <Wrench size={14} />}
            Controlla le 6 tabelle
          </button>
        </div>
        <p className='text-xs text-white/50'>
          Controlla che products, orders, suppliers, price_history, ad_queue e settings esistano davvero.
          Serve una sessione attiva e le chiavi Supabase.
        </p>
        {fixError ? <p className='text-xs text-rose-300'>{fixError}</p> : null}
        {fix ? (
          <div className='space-y-2'>
            <div className='flex flex-wrap gap-2'>
              {fix.tables.map((t) => (
                <span
                  key={t.table}
                  className={
                    'rounded-full px-2.5 py-1 text-[11px] ' +
                    (t.ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400')
                  }
                  title={t.message}
                >
                  {t.table}
                </span>
              ))}
            </div>
            <p className={'text-xs ' + (fix.ok ? 'text-emerald-400' : 'text-amber-300')}>{fix.note}</p>
          </div>
        ) : null}
      </div>

      <div className='glass p-5 text-sm text-white/60'>
        <div className='mb-2 font-medium text-white/80'>Come sistemare un errore</div>
        <ol className='list-decimal space-y-1 pl-5'>
          <li>Apri il file .env.local nella cartella del progetto (copialo da .env.example se non esiste).</li>
          <li>Incolla la chiave giusta dopo il segno uguale, senza spazi e senza virgolette.</li>
          <li>Salva e riavvia il software con npm run dev.</li>
          <li>Torna qui e premi Ricontrolla: la riga deve diventare verde.</li>
        </ol>
        {uniqueMissingEnv.length > 0 ? (
          <div className='mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200'>
            Variabili ancora mancanti:{' '}
            {uniqueMissingEnv.map((v) => (
              <code key={v} className='mr-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px]'>
                {v}
              </code>
            ))}
          </div>
        ) : null}
        <div className='mt-3 text-xs text-white/40'>
          Dove prendere le chiavi: Groq console.groq.com/keys - OpenRouter openrouter.ai/keys - Gemini
          aistudio.google.com/app/apikey - Supabase supabase.com - CJ My CJ &gt; Authorization &gt; API -
          Hugging Face huggingface.co/settings/tokens.
        </div>
      </div>

      <div className='glass space-y-3 border border-brand/20 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent p-5'>
        <div className='flex items-center gap-2.5'>
          <div className='grid h-9 w-9 place-items-center rounded-xl bg-brand text-xs font-bold text-white shadow-glass'>
            AK
          </div>
          <div>
            <div className='text-sm font-semibold text-white'>Software sviluppato e ideato da Ahsen Kurtoski</div>
            <div className='text-xs font-medium text-brand'>AhsenDS &bull; Fullstack Dropshipping &amp; AI Automation</div>
          </div>
        </div>
        <p className='text-xs leading-relaxed text-white/70'>
          Software gratuito e open source (licenza MIT). Nessun abbonamento e nessun paywall: usi le tue
          chiavi e resti padrone dei tuoi dati.
        </p>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-white/10 pt-2 text-xs text-white/50'>
          <span>Architetto &amp; Autore: <strong className='text-white'>Ahsen Kurtoski</strong></span>
          <span>Piattaforma: <strong className='text-white'>AhsenDS v1.0</strong></span>
          <span>Licenza: <strong className='text-emerald-400'>MIT</strong></span>
        </div>
      </div>
    </div>
  )
}
