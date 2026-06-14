import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Preparazione dell'evasione ordine (auto-fulfillment).
// Per sicurezza NON effettua l'addebito reale: prepara il payload pronto per CJ
// e marca l'ordine. La conferma finale dell'acquisto resta manuale.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const items = (body && body.items) || []
  const orderId = (body && body.orderId) || 'N/A'

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'Nessun articolo da evadere' }, { status: 400 })
  }

  const hasCj = !!(process.env.CJ_ACCESS_TOKEN || (process.env.CJ_EMAIL && process.env.CJ_API_KEY))

  const costTotal = items.reduce(
    (s: number, it: any) => s + (Number(it.cost) || 0) * (Number(it.qty) || 1),
    0
  )

  const cjPayload = {
    orderNumber: String(orderId),
    products: items.map((it: any) => ({
      vid: it.vid || it.id,
      quantity: Number(it.qty) || 1,
    })),
  }

  return NextResponse.json({
    ok: true,
    mode: hasCj ? 'cj-ready' : 'demo',
    status: 'fulfillment_prepared',
    costTotal: Math.round(costTotal * 100) / 100,
    cjPayload,
    note: hasCj
      ? 'Payload pronto per CJ. Conferma manuale richiesta prima dell addebito reale.'
      : 'Demo: collega CJ (CJ_EMAIL + CJ_API_KEY) per evadere ordini reali.',
  })
}
