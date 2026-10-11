import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { validateBody, adQueueBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

function dbNote(msg: string): string {
  if (/schema cache|does not exist|relation|not find the table/i.test(msg)) {
    return 'Tabella ad_queue mancante. Apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run.'
  }
  return 'Errore database: ' + msg
}

export async function GET() {
  if (!isSupabaseAdminConfigured) {
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

export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.default(req)
  if (rateLimitResponse) return rateLimitResponse
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ configured: false, ok: false, note: 'Aggiungi le chiavi Supabase per salvare in coda.' })
  }

  const validation = await validateBody(req, adQueueBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { product, platform, title, caption, hashtags, videoUrl, status, scheduledAt } = validation.data
  const row = {
    product,
    platform: platform || 'tiktok',
    title: title || '',
    caption: caption || '',
    hashtags: hashtags || '',
    video_url: videoUrl || '',
    status: status || 'queued',
    scheduled_at: scheduledAt || null,
  }
  const { data, error } = await supabaseAdmin.from('ad_queue').insert(row).select().single()
  if (error) return NextResponse.json({ configured: true, ok: false, note: dbNote(error.message) })
  return NextResponse.json({ configured: true, ok: true, data })
}
