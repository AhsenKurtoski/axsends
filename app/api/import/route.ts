import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

// Margine di default applicato al costo del fornitore
const MARKUP = 2.5

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

export async function POST(req: Request) {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 })
  }

  const rawItems: any[] = Array.isArray(payload?.items) ? payload.items : [payload]
  const items = rawItems.map(mapSupplierItem).filter((i) => i.externalId && i.name)

  if (items.length === 0) {
    return NextResponse.json({ error: 'Nessun prodotto valido da importare' }, { status: 400 })
  }

  const rows = items.map((i) => ({
    external_id: i.externalId,
    name: i.name,
    image: i.image,
    supplier: i.supplier,
    cost: i.cost,
    price: Math.round(i.cost * MARKUP * 100) / 100,
    stock: i.stock,
    sold: 0,
    status: 'active',
  }))

  if (!isSupabaseConfigured) {
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
