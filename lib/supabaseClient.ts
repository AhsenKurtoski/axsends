import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

function createClientOrThrow(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase non configurato. Imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }
  return createClient(url, anonKey)
}

let _supabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClientOrThrow()
    }
    return (_supabase as any)[prop]
  }
})

export function getSupabaseClient(): SupabaseClient {
  return createClientOrThrow()
}
