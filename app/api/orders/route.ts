import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      source: 'none',
      configured: false,
      data: [],
      note: 'Collega Supabase per gestire gli ordini reali.',
    })
  }
  const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', data })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!isSupabaseConfigured) {
    return NextResponse.json({ source: 'none', configured: false, error: 'Supabase non configurato' }, { status: 400 })
  }
  const { data, error } = await supabase.from('orders').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', data })
}
