'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setMessage('Configura Supabase (.env.local) per attivare la registrazione.')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Le password non coincidono.')
      return
    }
    if (password.length < 6) {
      setMessage('La password deve essere di almeno 6 caratteri.')
      return
    }
    setLoading(true)
    setMessage(null)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    // Se il progetto non richiede conferma email, la sessione e gia attiva.
    if (data?.session) {
      router.push('/')
      router.refresh()
      return
    }
    setMessage('Registrazione completata! Controlla la email per confermare, poi accedi.')
  }

  return (
    <div className='grid min-h-[80vh] place-items-center'>
      <form onSubmit={handleSignup} className='glass w-full max-w-sm space-y-4 p-7'>
        <div className='text-center'>
          <div className='mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-white'>A</div>
          <h1 className='text-xl font-semibold'>Crea account AhsenDS</h1>
          <p className='text-xs font-medium text-brand mt-0.5'>Costruito da Ahsen Kurtoski</p>
          <p className='text-xs text-white/40'>Area riservata</p>
        </div>
        <input
          type='email'
          required
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand/50'
        />
        <input
          type='password'
          required
          placeholder='Password (min 6 caratteri)'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand/50'
        />
        <input
          type='password'
          required
          placeholder='Conferma password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className='w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand/50'
        />
        <button
          type='submit'
          disabled={loading}
          className='w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'
        >
          {loading ? 'Registrazione...' : 'Registrati'}
        </button>
        {message ? <p className='text-center text-xs text-amber-400'>{message}</p> : null}
        <p className='text-center text-xs text-white/40'>
          Hai gia un account? <Link href='/login' className='text-brand underline'>Accedi</Link>
        </p>
        <div className='pt-3 border-t border-white/5 text-center text-[11px] text-white/40'>
          Piattaforma creata e sviluppata da <span className='text-white/70 font-medium'>Ahsen Kurtoski</span>
        </div>
      </form>
    </div>
  )
}
