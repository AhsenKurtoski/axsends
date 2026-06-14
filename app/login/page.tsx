'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!configured) {
      setMessage('Configura Supabase (.env.local) per attivare il login.')
      return
    }
    setLoading(true)
    setMessage(null)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage(error.message)
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className='grid min-h-[80vh] place-items-center'>
      <form onSubmit={handleLogin} className='glass w-full max-w-sm space-y-4 p-7'>
        <div className='text-center'>
          <div className='mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-bold text-white'>A</div>
          <h1 className='text-xl font-semibold'>Accedi ad AxsenDS</h1>
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
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand/50'
        />
        <button
          type='submit'
          disabled={loading}
          className='w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-50'
        >
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
        {message ? <p className='text-center text-xs text-amber-400'>{message}</p> : null}
      </form>
    </div>
  )
}
