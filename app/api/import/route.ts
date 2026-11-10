import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { createSupabaseServerClient, getUser } from '@/lib/supabaseAuth'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { validateBody, importBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { MARKUP } from '@/lib/products'

export const dynamic = 'force-dynamic'

type ImportItem = {
  externalId: string
  name: string
  cost: number
  image: string
  supplier: string
  stock?: number
}

// Mappa una risposta generica del fornitore (es. CJ Dropshipping) al nostro schema
function mapSupplierItem(raw: any): ImportItem {
  return {
    externalId: String(raw.pid ?? raw.id ?? raw.externalId ?? ''),
    name: raw.productNameEn ?? raw.name ?? 'Prodotto importato',
    cost: Number(raw.sellPrice ?? raw.cost ?? 0),
    image: raw.productImage ?? raw.image ?? '📦',
    supplier: raw.supplier ?? 'CJ Dropshipping',
    stock: typeof raw.stock === 'number' ? raw.stock : undefined,
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting per API di import
  const rateLimitResponse = await rateLimitConfigs.import(req)
  if (rateLimitResponse) return rateLimitResponse

  // Validazione body con Zod
  const validation = await validateBody(req, importBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const rawItems = validation.data.items
  const items = rawItems.map(mapSupplierItem).filter((i) => i.externalId && i.name)

  if (items.length === 0) {
    return NextResponse.json({ error: 'Nessun prodotto valido da importare' }, { status: 400 })
  }

  const rows = items.map((i) => {
    // id (primary key) e external_id: usiamo l'id del fornitore per entrambi,
    // cosi il re-import aggiorna lo stesso prodotto invece di duplicarlo.
    const row: Record<string, unknown> = {
      id: i.externalId,
      external_id: i.externalId,
      name: i.name,
      image: i.image,
      supplier: i.supplier,
      cost: i.cost,
      price: Math.round(i.cost * MARKUP * 100) / 100,
      status: 'active',
      updated_at: new Date().toISOString(),
    }
    // Lo stock si scrive solo se il fornitore lo fornisce davvero: un
    // re-import senza disponibilita' non deve azzerare il valore reale.
    if (typeof i.stock === 'number') row.stock = i.stock
    return row
  })

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase non configurato: aggiungi URL e anon key in .env.local.' },
      { status: 503 }
    )
  }

  // Con la service role l'import funziona anche da automazioni senza sessione.
  // Senza service role usiamo la sessione dell'utente autenticato: la RLS
  // consente al ruolo authenticated di scrivere. Nessuna anteprima simulata.
  if (isSupabaseAdminConfigured) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(rows, { onConflict: 'external_id' })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ source: 'supabase', imported: data?.length ?? 0, data })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Sessione non valida: effettua il login per importare i prodotti.' },
      { status: 401 }
    )
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'external_id' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', imported: data?.length ?? 0, data })
}
