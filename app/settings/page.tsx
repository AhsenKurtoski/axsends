'use client'

import { useEffect, useState } from 'react'
import { KeyRound, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((d) => {
        setStatus(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const keys = [
    { id: 'groq', name: 'Groq', desc: 'Veloce e gratis. Modello Llama 3.3 70B.', where: 'console.groq.com/keys', env: 'GROQ_API_KEY' },
    { id: 'openrouter', name: 'OpenRouter', desc: 'Modelli potenti gratuiti, limiti ampi.', where: 'openrouter.ai/keys', env: 'OPENROUTER_API_KEY' },
    { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 2.0 Flash, gratis con limiti ampi.', where: 'aistudio.google.com/app/apikey', env: 'GEMINI_API_KEY' },
  ]

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='flex items-center gap-2 text-2xl font-semibold'>
          <KeyRound className='text-brand' size={22} /> Stato AI e chiavi
        </h1>
        <p className='text-sm text-white/50'>Controlla se le tue chiavi AI funzionano e scopri come ottenerle.</p>
      </header>

      <div className='glass p-5'>
        {loading ? (
          <div className='flex items-center gap-2 text-sm text-white/50'>
            <Loader2 size={16} className='animate-spin' /> Controllo in corso...
          </div>
        ) : status ? (
          <div className='flex items-center gap-2 text-sm'>
            {status.test ? <CheckCircle2 className='text-emerald-400' size={18} /> : <XCircle className='text-rose-400' size={18} />}
            {status.test
              ? ('AI attiva e funzionante (provider in uso: ' + status.active + ').')
              : 'Nessuna AI risponde. Aggiungi almeno una chiave in .env.local e riavvia con npm run dev.'}
          </div>
        ) : (
          <p className='text-sm text-white/50'>Impossibile leggere lo stato.</p>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {keys.map((k) => {
          const on = status && status[k.id]
          return (
            <div key={k.id} className='glass space-y-2 p-5'>
              <div className='flex items-center justify-between'>
                <div className='text-sm font-medium'>{k.name}</div>
                <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (on ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/40')}>{on ? 'Configurata' : 'Mancante'}</span>
              </div>
              <p className='text-xs text-white/50'>{k.desc}</p>
              <div className='text-xs text-white/40'>Ottienila su: {k.where}</div>
              <code className='block rounded-lg bg-white/5 px-2 py-1 text-[11px] text-brand'>{k.env}=la-tua-chiave</code>
            </div>
          )
        })}
      </div>

      <div className='glass p-5 text-sm text-white/60'>
        <div className='mb-2 font-medium text-white/80'>Come attivarle</div>
        <ol className='list-decimal space-y-1 pl-5'>
          <li>Copia il file .env.example in .env.local nella cartella del progetto.</li>
          <li>Incolla la tua chiave dopo il segno uguale (senza spazi e senza virgolette).</li>
          <li>Salva e riavvia con npm run dev.</li>
          <li>Ricarica questa pagina: lo stato deve diventare verde.</li>
        </ol>
      </div>
    </div>
  )
}
