import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      source: 'none',
      configured: false,
      data: [],
      note: 'Collega Supabase per gestire i fornitori reali.',
    })
  }
  const { data, error } = await supabase.from('suppliers').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', data })
}
