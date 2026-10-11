import { NextRequest, NextResponse } from 'next/server'

// In-memory store per rate limiting (sostituire con Redis in produzione)
// Modulo di sicurezza di AhsenDS — Costruito da Ahsen Kurtoski
const store = new Map<string, { count: number; resetAt: number }>()

// Pulizia periodica del store elimina le finestre scadute
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) {
      store.delete(key)
    }
  }
}, 60_000)

if (typeof cleanupInterval === 'object' && cleanupInterval !== null && 'unref' in cleanupInterval) {
  ;(cleanupInterval as any).unref()
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyPrefix = 'api' } = config

  return async function (request: NextRequest): Promise<NextResponse | null> {
    // Chiave per IP + path: ogni endpoint ha il suo contatore
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const path = request.nextUrl.pathname
    const key = keyPrefix + ':' + ip + ':' + path

    const now = Date.now()
    const record = store.get(key)

    if (!record || record.resetAt < now) {
      // Prima richiesta nella finestra: apro il contatore
      store.set(key, { count: 1, resetAt: now + windowMs })
      return null
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)
      return NextResponse.json(
        { error: 'Troppe richieste. Riprova tra ' + retryAfter + ' secondi.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    record.count++
    return null
  }
}

// Configurazioni predefinite per tipologia di endpoint
export const rateLimitConfigs = {
  // API generiche: 60 richieste al minuto
  default: rateLimit({ windowMs: 60_000, maxRequests: 60 }),
  // API di ricerca: 30 richieste al minuto
  search: rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  // API AI (costose): 10 richieste al minuto
  ai: rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  // Pubblicazione social: 5 richieste al minuto
  social: rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  // Import prodotti: 10 richieste al minuto
  import: rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  // Login/registrazione: 5 richieste al minuto
  auth: rateLimit({ windowMs: 60_000, maxRequests: 5 }),
}

// Helper: applica un limiter e restituisci la risposta 429 oppure null
export async function applyRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof rateLimit>
): Promise<NextResponse | null> {
  return limiter(request)
}
