import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { products as mockProducts } from '@/lib/mockData'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ source: 'mock', data: mockProducts })
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sold', { ascending: false })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ source: 'supabase', data })
}
