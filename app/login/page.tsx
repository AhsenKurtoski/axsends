'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o password non corretti.'
  if (m.includes('email not confirmed')) return 'Email non ancora confermata. Controlla la posta.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Troppi tentativi. Riprova tra qualche minuto.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Errore di rete. Controlla la connessione e riprova.'
  return message
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  function redirectTarget(): string {
    if (typeof window === 'undefined') return '/app'
    const target = new URLSearchParams(window.location.search).get('redirect')
    if (target && target.startsWith('/app')) return target
    return '/app'
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setMessage('Supabase non configurato: aggiungi le chiavi in .env.local (vedi README).')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      )
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(friendlyError(error.message))
        setLoading(false)
        return
      }
      window.location.href = redirectTarget()
    } catch {
      setMessage('Errore imprevisto durante l\u2019accesso. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div className='grid min-h-[80vh] place-items-center px-4'>
      <form onSubmit={handleLogin} className='glass w-full max-w-sm space-y-4 p-7'>
        <div className='text-center'>
          <div className='mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-white'>A</div>
          <h1 className='text-xl font-semibold'>Accedi ad AhsenDS</h1>
          <p className='text-xs font-medium text-brand mt-0.5'>Costruito da Ahsen Kurtoski</p>
          <p className='text-xs text-white/40'>Area riservata all&apos;amministratore</p>
        </div>
        <div className='space-y-1.5'>
          <label htmlFor='login-email' className='block text-xs font-medium text-white/60'>Email</label>
          <input
            id='login-email'
            type='email'
            required
            autoComplete='email'
            placeholder='nome@esempio.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/40'
          />
        </div>
        <div className='space-y-1.5'>
          <label htmlFor='login-password' className='block text-xs font-medium text-white/60'>Password</label>
          <input
            id='login-password'
            type='password'
            required
            autoComplete='current-password'
            placeholder='La tua password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/40'
          />
        </div>
        <button
          type='submit'
          disabled={loading || !configured}
          className='w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
        {message ? (
          <p role='alert' aria-live='polite' className='text-center text-xs text-amber-400'>{message}</p>
        ) : null}
        {!configured ? (
          <p className='rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-center text-[11px] text-amber-300/90'>
            Login non configurato: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        ) : null}
        <p className='text-center text-xs text-white/40'>
          <Link href='/' className='text-brand underline-offset-2 hover:underline'>Torna al sito</Link>
        </p>
        <div className='pt-3 border-t border-white/5 text-center text-[11px] text-white/40'>
          Piattaforma creata e sviluppata da <span className='text-white/70 font-medium'>Ahsen Kurtoski</span>
        </div>
      </form>
    </div>
  )
}
