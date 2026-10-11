import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { validateBody, importBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Margine basso di default applicato al costo del fornitore: +25%.
const MARKUP = 1.25

type ImportItem = {
  externalId: string
  name: string
  cost: number
  image: string
  supplier: string
  stock: number
}

// Mappa una risposta generica del fornitore (es. CJ Dropshipping) al nostro schema
function mapSupplierItem(raw: any): ImportItem {
  return {
    externalId: String(raw.pid ?? raw.id ?? raw.externalId ?? ''),
    name: raw.productNameEn ?? raw.name ?? 'Prodotto importato',
    cost: Number(raw.sellPrice ?? raw.cost ?? 0),
    image: raw.productImage ?? raw.image ?? '📦',
    supplier: raw.supplier ?? 'CJ Dropshipping',
    stock: Number(raw.inventory ?? raw.stock ?? 0),
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

  const rows = items.map((i) => ({
    // id (primary key) e external_id: usiamo l'id del fornitore per entrambi,
    // cosi il re-import aggiorna lo stesso prodotto invece di duplicarlo.
    id: i.externalId,
    external_id: i.externalId,
    name: i.name,
    image: i.image,
    supplier: i.supplier,
    cost: i.cost,
    price: Math.round(i.cost * MARKUP * 100) / 100,
    stock: i.stock,
    sold: 0,
    status: 'active',
    updated_at: new Date().toISOString(),
  }))

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({
      source: 'mock',
      message: 'Supabase non configurato: anteprima import (nessun salvataggio).',
      preview: rows,
    })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .upsert(rows, { onConflict: 'external_id' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ source: 'supabase', imported: data?.length ?? 0, data })
}
