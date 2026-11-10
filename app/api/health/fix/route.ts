import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { createSupabaseServerClient, getUser } from '@/lib/supabaseAuth'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Verifica azionabile usata dalla pagina Diagnostica: controlla che tutte le
// tabelle dello schema esistano davvero e dice esattamente cosa fare.
// Richiede un utente autenticato; usa la service role se presente, altrimenti
// il client della sessione (la RLS autorizza il ruolo authenticated).

const TABLES = ['products', 'orders', 'suppliers', 'price_history', 'ad_queue', 'settings'] as const

export async function POST(req: NextRequest) {
  const limited = await rateLimitConfigs.default(req)
  if (limited) return limited

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase non configurato: aggiungi URL e anon key in .env.local e riavvia l app.' },
      { status: 503 }
    )
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sessione non valida: effettua il login.' }, { status: 401 })
  }

  // La sessione utente e' gia' verificata: senza service role possiamo usare
  // il client autenticato, che la RLS autorizza a leggere tutte le tabelle.
  const db = isSupabaseAdminConfigured ? supabaseAdmin : createSupabaseServerClient()
  const tables: Array<{ table: string; ok: boolean; message: string }> = []
  for (let i = 0; i < TABLES.length; i++) {
    const table = TABLES[i]
    const r = await db.from(table).select('*', { count: 'exact', head: true })
    if (r.error) {
      const missing = /schema cache|does not exist|relation|not find the table/i.test(r.error.message)
      tables.push({
        table,
        ok: false,
        message: missing ? 'Tabella mancante.' : r.error.message,
      })
    } else {
      tables.push({ table, ok: true, message: 'Tabella raggiungibile.' })
    }
  }

  const missing = tables.filter((t) => !t.ok)
  const body = {
    ok: missing.length === 0,
    checked: tables.length,
    missing: missing.length,
    tables,
    note:
      missing.length === 0
        ? 'Tutte le tabelle dello schema rispondono correttamente.'
        : 'Una o piu tabelle mancano: apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run, poi ricontrolla.',
  }

  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
