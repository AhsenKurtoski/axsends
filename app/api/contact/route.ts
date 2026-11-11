import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { validateBody } from '@/lib/validations'
import { sendContactNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

// Modulo contatti pubblico. Le richieste sono salvate nella tabella settings
// (chiave contact_request:<uuid>) tramite service role: nessuna nuova tabella
// e nessuna esposizione di dati al browser. La RLS resta attiva.
const contactBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  organisation: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(['it', 'en']).optional().default('it'),
  consent: z.literal(true),
  website: z.string().max(200).optional().default(''),
})

function hasForeignOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false

  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]
    .trim()
  if (!host) return true

  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitConfigs.contact(req)
  if (limited) return limited

  if (hasForeignOrigin(req)) {
    return NextResponse.json(
      { ok: false, code: 'origin', error: 'Origine non autorizzata.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const validation = await validateBody(req, contactBodySchema)
  if (!validation.success) {
    return NextResponse.json(
      { ok: false, code: 'invalid', error: 'Controlla i campi e riprova.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const data = validation.data

  // Honeypot: i bot compilano il campo nascosto. Rispondiamo come se fosse
  // andata a buon fine, senza scrivere nulla nel database.
  if (data.website.trim()) {
    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json(
      {
        ok: false,
        code: 'unavailable',
        error: 'Modulo contatti non configurato. Scrivi a ahsenkurtoski@financier.com oppure su WhatsApp +39 331 205 3485',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const { error } = await supabaseAdmin.from('settings').insert({
    key: 'contact_request:' + id,
    value: {
      type: 'contact_request',
      name: data.name,
      email: data.email,
      organisation: data.organisation || null,
      message: data.message,
      locale: data.locale,
      consent: true,
      consentAt: createdAt,
      status: 'new',
      source: 'website',
      createdAt,
    },
  })

  if (error) {
    console.error('[contact] salvataggio non riuscito:', error.message)
    return NextResponse.json(
      {
        ok: false,
        code: 'server',
        error: 'Invio non riuscito. Riprova o scrivi a ahsenkurtoski@financier.com oppure su WhatsApp +39 331 205 3485',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // La richiesta è già salvata: una notifica email fallita non deve perdere
  // il contatto né mostrare un errore al visitatore. Lo stato resta visibile
  // nella risposta e nei log server-side.
  const notification = await sendContactNotification({
    id,
    name: data.name,
    email: data.email,
    organisation: data.organisation || null,
    message: data.message,
    locale: data.locale,
    createdAt,
  })

  if (!notification.ok && !notification.skipped) {
    console.error('[contact] notifica email non inviata (richiesta salvata)')
  }

  return NextResponse.json(
    {
      ok: true,
      id,
      email: notification.ok ? 'sent' : notification.skipped ? 'not_configured' : 'failed',
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  )
}
