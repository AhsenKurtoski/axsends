import { NextResponse, NextRequest } from 'next/server'
import { createSupabaseServerClient, getUser } from '@/lib/supabaseAuth'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function dbNote(msg: string): string {
  if (/schema cache|does not exist|relation|not find the table|permission denied|row-level security/i.test(msg)) {
    if (/permission denied|row-level security/i.test(msg)) {
      return 'Accesso negato dal database (RLS): rifai il login, oppure esegui supabase-schema.sql su Supabase.'
    }
    return 'Database collegato ma tabelle non ancora create. Apri Supabase, vai su SQL Editor, incolla tutto il file supabase-schema.sql e premi Run. Poi ricarica.'
  }
  return 'Errore database: ' + msg
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.default(req)
  if (rateLimitResponse) return rateLimitResponse

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      source: 'none',
      configured: false,
      data: [],
      note: 'Collega Supabase (o importa dal Radar/Ricerca) per il catalogo prodotti reale.',
    })
  }

  // Con la RLS attiva serve una sessione valida per leggere i dati.
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ source: 'supabase', configured: true, data: [], note: 'Sessione non valida: rifai il login.' }, { status: 401 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.from('products').select('*').order('sold', { ascending: false })
  if (error) {
    return NextResponse.json({ source: 'supabase', configured: true, data: [], note: dbNote(error.message) })
  }
  return NextResponse.json({ source: 'supabase', data: data || [] })
}
