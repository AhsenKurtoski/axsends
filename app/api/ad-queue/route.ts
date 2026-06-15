import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

function configured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function dbNote(msg: string): string {
  if (/schema cache|does not exist|relation|not find the table/i.test(msg)) {
    return 'Tabella ad_queue mancante. Apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run.'
  }
  return 'Errore database: ' + msg
}

export async function GET() {
  if (!configured()) {
    return NextResponse.json({ configured: false, note: 'Aggiungi le chiavi Supabase per usare la coda di pubblicazione.', data: [] })
  }
  const { data, error } = await supabaseAdmin
    .from('ad_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ configured: true, note: dbNote(error.message), data: [] })
  return NextResponse.json({ configured: true, data: data || [] })
}

export async function POST(req: Request) {
  if (!configured()) {
    return NextResponse.json({ configured: false, ok: false, note: 'Aggiungi le chiavi Supabase per salvare in coda.' })
  }
  const b = (await req.json().catch(() => ({}))) as any
  const hashtags = Array.isArray(b && b.hashtags) ? b.hashtags.join(' ') : (b && b.hashtags) || ''
  const row = {
    product: b && b.product ? String(b.product) : 'Prodotto',
    platform: b && b.platform ? String(b.platform) : 'tiktok',
    title: (b && b.title) || '',
    caption: (b && b.caption) || '',
    hashtags,
    video_url: (b && b.videoUrl) || '',
    status: 'queued',
    scheduled_at: (b && b.scheduledAt) || null,
  }
  const { data, error } = await supabaseAdmin.from('ad_queue').insert(row).select().single()
  if (error) return NextResponse.json({ configured: true, ok: false, note: dbNote(error.message) })
  return NextResponse.json({ configured: true, ok: true, data })
}
