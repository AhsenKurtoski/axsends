import { NextResponse, NextRequest } from 'next/server'
import { createSupabaseServerClient, getUser } from '@/lib/supabaseAuth'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function dbNote(msg: string): string {
  if (/permission denied|row-level security/i.test(msg)) {
    return 'Accesso negato dal database (RLS): rifai il login, oppure esegui supabase-schema.sql su Supabase.'
  }
  if (/schema cache|does not exist|relation|not find the table/i.test(msg)) {
    return 'Database collegato ma tabelle non ancora create. Apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run. Poi ricarica.'
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
      note: 'Collega Supabase per gestire i fornitori reali.',
    })
  }

  // Con la RLS attiva serve una sessione valida per leggere i dati.
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ source: 'supabase', configured: true, data: [], note: 'Sessione non valida: rifai il login.' }, { status: 401 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.from('suppliers').select('*')
  if (error) {
    return NextResponse.json({ source: 'supabase', configured: true, data: [], note: dbNote(error.message) })
  }
  return NextResponse.json({ source: 'supabase', data: data || [] })
}
