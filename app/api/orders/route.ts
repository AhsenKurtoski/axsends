import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { orders as mockOrders } from '@/lib/mockData'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ source: 'mock', data: mockOrders })
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', data })
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!isSupabaseConfigured) {
    return NextResponse.json({ source: 'mock', data: { id: 'demo', ...body } })
  }
  const { data, error } = await supabase.from('orders').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', data })
}
