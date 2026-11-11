'use client'

import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react'

type Status = 'idle' | 'sending' | 'success' | 'error'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-normal text-white outline-none placeholder:text-white/25 focus:border-brand/60 focus:ring-2 focus:ring-brand/15'

const labelClass = 'flex flex-col gap-1.5 text-[11px] font-medium text-white/50'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      organisation: String(data.get('organisation') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      consent: data.get('consent') === 'on',
      locale: 'it',
      website: String(data.get('website') ?? '').trim(),
    }

    setStatus('sending')
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message =
          'Invio non riuscito. Riprova o scrivi direttamente a ahsenkurtoski@financier.com.'
        if (res.status === 400) {
          message = 'Controlla i campi: nome, email, messaggio e consenso sono obbligatori.'
        } else if (res.status === 429) {
          message = 'Hai inviato troppe richieste. Attendi un minuto e riprova.'
        } else if (res.status === 503) {
          message =
            'Il modulo non è disponibile in questo momento. Scrivi direttamente a ahsenkurtoski@financier.com.'
        }
        setError(message)
        setStatus('error')
        return
      }

      form.reset()
      setStatus('success')
    } catch {
      setError(
        'Errore di rete. Controlla la connessione o scrivi direttamente a ahsenkurtoski@financier.com.'
      )
      setStatus('error')
    }
  }

  return (
    <div
      id='contact-form'
      className='rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6'
    >
      {status === 'success' ? (
        <div
          role='status'
          aria-live='polite'
          className='flex min-h-[330px] flex-col items-start justify-center'
        >
          <span className='grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300'>
            <CheckCircle2 size={22} />
          </span>
          <h3 className='mt-4 text-lg font-semibold'>Richiesta inviata</h3>
          <p className='mt-2 max-w-md text-sm leading-relaxed text-white/55'>
            Grazie. Abbiamo registrato il messaggio e ti risponderemo all’indirizzo email indicato.
          </p>
          <button
            type='button'
            onClick={() => setStatus('idle')}
            className='mt-5 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/5'
          >
            Invia un’altra richiesta
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          action='mailto:ahsenkurtoski@financier.com'
          method='post'
          encType='text/plain'
          className='space-y-3.5'
        >
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className={labelClass}>
              Nome e cognome *
              <input
                name='name'
                type='text'
                autoComplete='name'
                minLength={2}
                maxLength={120}
                required
                placeholder='Mario Rossi'
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Email *
              <input
                name='email'
                type='email'
                autoComplete='email'
                maxLength={200}
                required
                placeholder='nome@organizzazione.it'
                className={inputClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Organizzazione
            <input
              name='organisation'
              type='text'
              autoComplete='organization'
              maxLength={160}
              placeholder='Istituzione, azienda o team'
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Come possiamo aiutarti? *
            <textarea
              name='message'
              minLength={10}
              maxLength={4000}
              rows={5}
              required
              placeholder='Descrivi il progetto, il contesto e il risultato che vuoi ottenere.'
              className={`${inputClass} min-h-[120px] resize-y`}
            />
          </label>

          <div className='absolute -left-[9999px] top-auto h-px w-px overflow-hidden' aria-hidden='true'>
            <label htmlFor='contact-website'>Website</label>
            <input id='contact-website' name='website' type='text' tabIndex={-1} autoComplete='off' />
          </div>

          <label className='flex items-start gap-2.5 text-[11px] leading-relaxed text-white/45'>
            <input
              type='checkbox'
              name='consent'
              required
              className='mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#34d399]'
            />
            <span>
              Acconsento a essere ricontattato per questa richiesta. I dati saranno usati solo per
              rispondere a questo messaggio.
            </span>
          </label>

          {error ? (
            <p role='alert' className='flex items-start gap-2 text-xs leading-relaxed text-rose-300'>
              <AlertCircle size={14} className='mt-0.5 shrink-0' /> {error}
            </p>
          ) : null}

          <button
            type='submit'
            disabled={status === 'sending'}
            className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60'
          >
            {status === 'sending' ? (
              <>
                <Loader2 size={15} className='animate-spin' /> Invio…
              </>
            ) : (
              <>
                <Send size={15} /> Invia richiesta
              </>
            )}
          </button>

          <p className='text-[10px] leading-relaxed text-white/30'>
            Campi contrassegnati con * obbligatori. Nessuna newsletter automatica.
          </p>
        </form>
      )}
    </div>
  )
}
