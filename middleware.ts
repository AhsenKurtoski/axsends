import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Middleware di protezione rotte per AhsenDS
// Costruito da Ahsen Kurtoski

type CookieToSet = { name: string; value: string; options?: CookieOptions }

// Percorsi sempre accessibili senza sessione.
// /api/monitor e' richiamato dal cron di Vercel, che non ha cookie utente:
// l'endpoint si protegge da solo con CRON_SECRET (o con una sessione valida).
function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/login' || pathname.startsWith('/login/')) return true
  if (pathname === '/launch' || pathname.startsWith('/launch/')) return true
  if (pathname === '/api/health' || pathname === '/api/monitor') return true
  // Modulo contatti pubblico: l'endpoint valida input, origine e rate limit.
  if (pathname === '/api/contact') return true
  return false
}

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Se Supabase non e' configurato, permetti accesso completo (modalita' demo)
  if (!url || !anon) {
    return NextResponse.next()
  }

  const pathname = req.nextUrl.pathname
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Proteggi solo la dashboard e le API private. Le URL sconosciute devono
  // arrivare al 404 di Next, non essere redirette al login.
  const isDashboard = pathname === '/app' || pathname.startsWith('/app/')
  const isPrivateApi = pathname.startsWith('/api/')
  if (!isDashboard && !isPrivateApi) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Le API rispondono in JSON (non con un redirect HTML): il client client
    // capisce cosi' che la sessione non e' valida.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non autenticato. Effettua il login per usare questa API.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
