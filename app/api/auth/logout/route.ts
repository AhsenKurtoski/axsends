import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseAuth'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

// Cancella la sessione Supabase (cookie auth) e svuota i cookie di login.
export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, note: 'Supabase non configurato: nulla da annullare.' })
  }

  try {
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
  } catch {
    // Anche se signOut fallisce, rimandiamo al login: il middleware blocca ugualmente.
    return NextResponse.json({ ok: true, note: 'Sessione chiusa.' })
  }

  return NextResponse.json({ ok: true })
}
