import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

function dbNote(msg: string): string {
  if (/schema cache|does not exist|relation|not find the table/i.test(msg)) {
    return 'Database collegato ma tabelle non ancora create. Apri Supabase, vai su SQL Editor, incolla tutto il file supabase-schema.sql e premi Run. Poi ricarica.'
  }
  return 'Errore database: ' + msg
}

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      source: 'none',
      configured: false,
      data: [],
      note: 'Collega Supabase (o importa dal Radar/Ricerca) per il catalogo prodotti reale.',
    })
  }
  const { data, error } = await supabase.from('products').select('*').order('sold', { ascending: false })
  if (error) {
    return NextResponse.json({ source: 'supabase', configured: true, data: [], note: dbNote(error.message) })
  }
  return NextResponse.json({ source: 'supabase', data: data || [] })
}
