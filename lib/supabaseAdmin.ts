import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseAdminConfigured = Boolean(url && serviceKey)

function createAdminClientOrThrow(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase Admin non configurato. Imposta NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

let _supabaseAdmin: SupabaseClient | null = null

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createAdminClientOrThrow()
    }
    return (_supabaseAdmin as any)[prop]
  }
})

export function getSupabaseAdminClient(): SupabaseClient {
  return createAdminClientOrThrow()
}
