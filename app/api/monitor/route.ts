import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// Endpoint richiamato dal cron di Vercel (vedi vercel.json) per registrare
// lo storico prezzi/stock. Gira in background: nessun utente collegato.
export async function GET(req: Request) {
  // Il cron di Vercel non ha cookie utente: accettiamo la chiamata solo se
  // arriva con il CRON_SECRET (quando configurato) per evitare abusi.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== 'Bearer ' + secret) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({
      source: 'mock',
      message: 'Supabase non configurato: monitor in modalità demo.',
      checked: 0,
    })
  }

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, cost, stock')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const snapshots = (products ?? []).map((p: any) => ({
    product_id: p.id,
    cost: p.cost,
    stock: p.stock,
  }))

  if (snapshots.length > 0) {
    const { error: insertError } = await supabaseAdmin.from('price_history').insert(snapshots)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ source: 'supabase', checked: snapshots.length })
}
