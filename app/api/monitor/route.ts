import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { getUser } from '@/lib/supabaseAuth'

export const dynamic = 'force-dynamic'

// Endpoint richiamato dal cron di Vercel (vedi vercel.json) per registrare
// lo storico prezzi/stock. Gira in background: nessun utente collegato.
export async function GET(req: Request) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({
      source: 'unconfigured',
      message: 'Supabase non configurato: nessun controllo prezzi/stock eseguito.',
      checked: 0,
    })
  }

  // Due modi di accesso: il cron di Vercel (Bearer CRON_SECRET) oppure una
  // sessione utente valida quando lo si richiama a mano dalla dashboard.
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const viaCron = Boolean(secret) && auth === 'Bearer ' + secret

  if (!viaCron) {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato. Usa il cron con CRON_SECRET oppure effettua il login.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }
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
