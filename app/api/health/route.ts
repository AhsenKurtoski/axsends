import { NextResponse, type NextRequest } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { probeGroq, probeOpenRouter, probeGemini, providerKeyCount, type AiProbe } from '@/lib/ai'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { searchCjProducts } from '@/lib/cj'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { generateImage, hfImageModel } from '@/lib/hf'
import { probeVideoSpace, videoModelLabel, videoConfigured } from '@/lib/video'
import { contactNotifyFrom, contactNotifyTo, emailNotificationsConfigured } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

// Diagnostica completa dell'installazione: ogni servizio viene contattato
// davvero. Nessun valore simulato: se una chiave manca, lo stato e' "missing".

export type HealthStatus = 'ok' | 'error' | 'missing' | 'configured'

export type HealthService = {
  id: string
  name: string
  group: string
  powers: string
  status: HealthStatus
  message: string
  fix?: { env: string[]; hint?: string }
}

export type TableCheck = { table: string; ok: boolean; message: string }

export type HealthReport = {
  app: string
  developer: string
  generatedAt: string
  aiOk: boolean
  summary: { total: number; ok: number; missing: number; error: number; configured: number }
  readiness: {
    score: number
    label: string
    essentials: Array<{ id: string; label: string; ok: boolean; message: string }>
  }
  keys: { groq: number; gemini: number; openrouter: number }
  tables: { checked: boolean; note: string; items: TableCheck[] }
  missingEnv: string[]
  envFile: { exists: boolean; path: string; fromSystemEnv: boolean }
  services: HealthService[]
}

const AI_POWERS = 'Descrizioni, ads, ebook, siti web, UGC e materiale di marketing'

function aiSvc(id: string, name: string, probe: AiProbe, env: string[]): HealthService {
  const base = { id, name, group: 'AI (testi)', powers: AI_POWERS, fix: { env } }
  if (probe.ok === null) return { ...base, status: 'missing', message: probe.message }
  if (probe.ok) return { ...base, status: 'ok', message: probe.message }
  if (probe.temporary) return { ...base, status: 'configured', message: probe.message }
  return { ...base, status: 'error', message: probe.message }
}

async function checkSupabase(): Promise<HealthService> {
  const base = {
    id: 'supabase',
    name: 'Supabase (database e login)',
    group: 'Infrastruttura',
    powers: 'Catalogo, ordini, fornitori, coda ads, storico prezzi, autenticazione',
    fix: { env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] },
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return {
      ...base,
      status: 'missing',
      message: 'Mancano NEXT_PUBLIC_SUPABASE_URL e/o NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
    }
  }
  try {
    // La Auth API risponde anche senza service role: verifica che URL e anon
    // key siano validi e che il progetto Supabase sia raggiungibile.
    const authRes = await fetch(url.replace(/\/$/, '') + '/auth/v1/health', {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + anonKey },
      cache: 'no-store',
    })
    if (!authRes.ok) {
      return {
        ...base,
        status: 'error',
        message: 'Supabase ha risposto HTTP ' + authRes.status + ': controlla URL e anon key.',
      }
    }
    if (!isSupabaseAdminConfigured) {
      return {
        ...base,
        status: 'configured',
        message:
          'URL e anon key valide: login, import e ordini con sessione attivi. Aggiungi SUPABASE_SERVICE_ROLE_KEY per automazioni server-side (monitor, autopilot) senza sessione.',
      }
    }
    const r = await supabaseAdmin.from('products').select('id').limit(1)
    if (r.error) {
      const missing = /schema cache|does not exist|relation|not find the table/i.test(r.error.message)
      return {
        ...base,
        status: 'error',
        message: missing
          ? 'Connesso ma le tabelle non esistono ancora. Apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run.'
          : 'Connesso ma query fallita: ' + r.error.message,
      }
    }
    return { ...base, status: 'ok', message: 'Connesso, chiavi valide e tabelle raggiungibili.' }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di connessione: ' + String(e).slice(0, 160) }
  }
}

async function checkCj(): Promise<HealthService> {
  const base = {
    id: 'cj',
    name: 'CJ Dropshipping',
    group: 'Prodotti',
    powers: 'Ricerca prodotti reali, Radar, import e catalogo',
    fix: { env: ['CJ_EMAIL', 'CJ_API_KEY'] },
  }
  const configured = Boolean(process.env.CJ_ACCESS_TOKEN || (process.env.CJ_EMAIL && process.env.CJ_API_KEY))
  if (!configured) {
    return { ...base, status: 'missing', message: 'Mancano CJ_EMAIL + CJ_API_KEY (oppure CJ_ACCESS_TOKEN) in .env.local.' }
  }
  try {
    const r = await searchCjProducts({ pageSize: 1 })
    if (r.ok) return { ...base, status: 'ok', message: 'Autenticazione riuscita e prodotti raggiungibili.' }
    if (r.error === 'no-credentials') {
      return { ...base, status: 'error', message: 'Credenziali non valide: controlla email e API Key in My CJ > Authorization > API.' }
    }
    return { ...base, status: 'error', message: 'CJ ha risposto con errore: ' + String(r.error).slice(0, 160) }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkImages(): Promise<HealthService> {
  const base = {
    id: 'images',
    name: 'Immagini AI (Pollinations)',
    group: 'Creativita',
    powers: 'Creativita e fotogrammi delle ads',
    fix: { env: ['HF_IMAGE_MODEL'], hint: 'Provider attivo: ' + hfImageModel() },
  }
  try {
    // Prova reale: genera un'immagine minuscola. Pollinations e' gratuito e non
    // richiede chiavi, quindi questo controllo funziona su ogni installazione.
    const img = await generateImage('a red apple on a white background', { width: 64, height: 64, seed: 1 })
    if (img) {
      return { ...base, status: 'ok', message: 'Funzionante: immagini generate gratuitamente, senza chiavi e senza carta.' }
    }
    return { ...base, status: 'error', message: 'Il generatore immagini non ha risposto. Riprova tra un minuto.' }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkVideo(): Promise<HealthService> {
  const base = {
    id: 'video',
    name: 'Video AI (Hugging Face ZeroGPU)',
    group: 'Creativita',
    powers: 'Video mp4 verticale generato dall AI, gratis',
    fix: {
      env: ['HF_VIDEO_SPACE', 'HUGGINGFACE_API_TOKEN'],
      hint: 'Modello video: ' + videoModelLabel(),
    },
  }
  if (!videoConfigured()) {
    return { ...base, status: 'missing', message: 'Generazione video disattivata (HF_VIDEO_SPACE=off).' }
  }
  const probe = await probeVideoSpace()
  if (probe.ok) return { ...base, status: 'ok', message: probe.message }
  return { ...base, status: 'error', message: probe.message }
}

async function checkYouTube(): Promise<HealthService> {
  const base = {
    id: 'youtube',
    name: 'YouTube',
    group: 'Pubblicazione',
    powers: 'Upload automatico di video e Shorts',
    fix: { env: ['YOUTUBE_ACCESS_TOKEN'] },
  }
  const token = process.env.YOUTUBE_ACCESS_TOKEN
  if (!token) return { ...base, status: 'missing', message: 'Manca YOUTUBE_ACCESS_TOKEN in .env.local.' }
  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
      headers: { Authorization: 'Bearer ' + token },
    })
    if (r.ok) return { ...base, status: 'ok', message: 'Token valido e canale collegato.' }
    return {
      ...base,
      status: 'error',
      message:
        'Token non valido o scaduto (HTTP ' + r.status + '). I token OAuth durano circa 1 ora: rigenerane uno nuovo.',
    }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkFacebook(): Promise<HealthService> {
  const base = {
    id: 'facebook',
    name: 'Facebook Pages',
    group: 'Pubblicazione',
    powers: 'Post e video sulla tua Pagina',
    fix: { env: ['FB_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'] },
  }
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FB_PAGE_ID
  if (!token || !pageId) return { ...base, status: 'missing', message: 'Mancano FACEBOOK_PAGE_ACCESS_TOKEN e/o FB_PAGE_ID.' }
  try {
    const r = await fetch('https://graph.facebook.com/v21.0/' + pageId + '?fields=name&access_token=' + token)
    const j: any = await r.json().catch(() => null)
    if (r.ok && j && j.name) return { ...base, status: 'ok', message: 'Collegato alla Pagina: ' + j.name + '.' }
    const msg = (j && j.error && j.error.message) || 'HTTP ' + r.status
    return { ...base, status: 'error', message: 'Errore: ' + String(msg).slice(0, 160) }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkInstagram(): Promise<HealthService> {
  const base = {
    id: 'instagram',
    name: 'Instagram',
    group: 'Pubblicazione',
    powers: 'Pubblicazione di Reels e post',
    fix: { env: ['IG_USER_ID', 'INSTAGRAM_ACCESS_TOKEN'] },
  }
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUser = process.env.IG_USER_ID
  if (!token || !igUser) return { ...base, status: 'missing', message: 'Mancano INSTAGRAM_ACCESS_TOKEN e/o IG_USER_ID.' }
  try {
    const r = await fetch('https://graph.facebook.com/v21.0/' + igUser + '?fields=username&access_token=' + token)
    const j: any = await r.json().catch(() => null)
    if (r.ok && j && j.username) return { ...base, status: 'ok', message: 'Collegato all account: @' + j.username + '.' }
    const msg = (j && j.error && j.error.message) || 'HTTP ' + r.status
    return { ...base, status: 'error', message: 'Errore: ' + String(msg).slice(0, 160) }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

function checkEmailNotifications(): HealthService {
  const base = {
    id: 'email',
    name: 'Email notifiche',
    group: 'Infrastruttura',
    powers: 'Notifica al proprietario per ogni nuova richiesta dal modulo contatti',
    fix: { env: ['SENDGRID_API_KEY', 'CONTACT_NOTIFY_TO', 'CONTACT_NOTIFY_FROM'] },
  }
  if (!emailNotificationsConfigured()) {
    return {
      ...base,
      status: 'missing',
      message:
        'Manca SENDGRID_API_KEY: le richieste restano salvate, ma non parte la notifica email. Configura SendGrid e verifica il Single Sender.',
    }
  }
  return {
    ...base,
    status: 'configured',
    message:
      'Chiave presente. Mittente: ' + contactNotifyFrom() + ' · destinatario: ' + contactNotifyTo() + '. La verifica avviene al primo invio.',
  }
}

function checkTikTok(): HealthService {
  const base = {
    id: 'tiktok',
    name: 'TikTok',
    group: 'Pubblicazione',
    powers: 'Pubblicazione video (modalita privata finche l app non e approvata)',
    fix: { env: ['TIKTOK_ACCESS_TOKEN'] },
  }
  const token = process.env.TIKTOK_ACCESS_TOKEN
  if (!token) {
    return {
      ...base,
      status: 'missing',
      message: 'Manca TIKTOK_ACCESS_TOKEN. Richiede un app approvata con scope video.publish. Intanto puoi pubblicare a mano.',
    }
  }
  return {
    ...base,
    status: 'configured',
    message: 'Token presente. La verifica completa avviene alla pubblicazione: i token TikTok durano 24 ore.',
  }
}

// Chiavi che possono arrivare anche dalle variabili d'ambiente del sistema
// (per esempio impostate in Windows o nel pannello di hosting), non solo da .env.local.
const SYSTEM_ENV_KEYS = [
  'GROQ_API_KEY',
  'GROQ_API_KEY_2',
  'OPENROUTER_API_KEY',
  'OPENROUTER_API_KEY_2',
  'GEMINI_API_KEY',
  'GEMINI_API_KEY_2',
  'HF_VIDEO_SPACE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CJ_API_KEY',
  'CJ_ACCESS_TOKEN',
  'HUGGINGFACE_API_TOKEN',
  'YOUTUBE_ACCESS_TOKEN',
  'INSTAGRAM_ACCESS_TOKEN',
  'FACEBOOK_PAGE_ACCESS_TOKEN',
  'TIKTOK_ACCESS_TOKEN',
  'SENDGRID_API_KEY',
  'CONTACT_NOTIFY_TO',
  'CONTACT_NOTIFY_FROM',
]

function envFileInfo(): { exists: boolean; path: string; fromSystemEnv: boolean } {
  const fromSystemEnv = SYSTEM_ENV_KEYS.some((k) => Boolean(process.env[k]))
  const candidates = ['.env.local', '.env']
  for (let i = 0; i < candidates.length; i++) {
    const p = path.join(process.cwd(), candidates[i])
    if (fs.existsSync(p)) return { exists: true, path: candidates[i], fromSystemEnv }
  }
  return { exists: false, path: '.env.local', fromSystemEnv }
}

const TABLES = ['products', 'orders', 'suppliers', 'price_history', 'ad_queue', 'settings'] as const

// Verifica reale delle tabelle: con la service role la diagnostica controlla lo
// schema senza bisogno di premere altri pulsanti.
async function checkTables(): Promise<{ checked: boolean; note: string; items: TableCheck[] }> {
  if (!isSupabaseAdminConfigured) {
    return {
      checked: false,
      note: 'Serve SUPABASE_SERVICE_ROLE_KEY per verificare le tabelle da qui. In alternativa usa il pulsante qui sotto con la sessione attiva.',
      items: [],
    }
  }
  const items: TableCheck[] = []
  for (let i = 0; i < TABLES.length; i++) {
    const table = TABLES[i]
    const r = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
    if (r.error) {
      const missing = /schema cache|does not exist|relation|not find the table/i.test(r.error.message)
      items.push({
        table,
        ok: false,
        message: missing
          ? 'Tabella mancante: apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run.'
          : r.error.message,
      })
    } else {
      items.push({ table, ok: true, message: 'Tabella raggiungibile.' })
    }
  }
  const missing = items.filter((t) => !t.ok).length
  return {
    checked: true,
    items,
    note:
      missing === 0
        ? 'Tutte le 6 tabelle dello schema rispondono correttamente.'
        : missing + ' tabelle mancanti: apri Supabase > SQL Editor, incolla supabase-schema.sql e premi Run.',
  }
}

export async function GET(req: NextRequest) {
  // Endpoint pubblico e diagnostico: chiama servizi esterni, quindi va limitato.
  const limited = await rateLimitConfigs.default(req)
  if (limited) return limited

  const [groq, openrouter, gemini] = await Promise.all([probeGroq(), probeOpenRouter(), probeGemini()])
  const [supabase, cj, images, video, youtube, facebook, instagram] = await Promise.all([
    checkSupabase(),
    checkCj(),
    checkImages(),
    checkVideo(),
    checkYouTube(),
    checkFacebook(),
    checkInstagram(),
  ])

  const services: HealthService[] = [
    aiSvc('groq', 'Groq', groq, ['GROQ_API_KEY', 'GROQ_API_KEY_2', 'GROQ_MODEL']),
    aiSvc('openrouter', 'OpenRouter', openrouter, ['OPENROUTER_API_KEY', 'OPENROUTER_API_KEY_2', 'OPENROUTER_MODEL']),
    aiSvc('gemini', 'Google Gemini', gemini, ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_MODEL']),
    supabase,
    checkEmailNotifications(),
    cj,
    images,
    video,
    youtube,
    instagram,
    facebook,
    checkTikTok(),
  ]

  const tables = await checkTables()

  const aiOk = [groq, openrouter, gemini].some((p) => p.ok === true)
  const summary = {
    total: services.length,
    ok: services.filter((s) => s.status === 'ok').length,
    missing: services.filter((s) => s.status === 'missing').length,
    error: services.filter((s) => s.status === 'error').length,
    configured: services.filter((s) => s.status === 'configured').length,
  }

  // Cosa serve davvero per usare il software: testo AI, immagini, database.
  const essentials = [
    {
      id: 'ai',
      label: 'AI testi',
      ok: aiOk,
      message: aiOk ? 'Almeno un provider risponde.' : 'Nessun provider AI risponde: controlla le chiavi.',
    },
    {
      id: 'images',
      label: 'Immagini AI',
      ok: images.status === 'ok',
      message: images.message,
    },
    {
      id: 'database',
      label: 'Database',
      ok: supabase.status === 'ok',
      message: supabase.message,
    },
  ]
  const score = Math.round((essentials.filter((e) => e.ok).length / essentials.length) * 100)
  const label =
    score === 100
      ? 'Pronto: testo AI, immagini e database funzionano. I servizi social si attivano quando aggiungi i token.'
      : score >= 66
        ? 'Quasi pronto: manca ' + essentials.filter((e) => !e.ok).map((e) => e.label).join(', ') + '.'
        : 'Base incompleta: manca ' + essentials.filter((e) => !e.ok).map((e) => e.label).join(', ') + '.'

  const missingEnvRaw = services
    .filter((s) => s.status === 'missing' && s.fix)
    .flatMap((s) => (s.fix ? s.fix.env : []))
  const missingEnv = missingEnvRaw.filter((v, i) => missingEnvRaw.indexOf(v) === i)

  const report: HealthReport = {
    app: 'AhsenDS',
    developer: 'Ahsen Kurtoski',
    generatedAt: new Date().toISOString(),
    aiOk,
    summary,
    readiness: { score, label, essentials },
    keys: {
      groq: providerKeyCount('groq'),
      gemini: providerKeyCount('gemini'),
      openrouter: providerKeyCount('openrouter'),
    },
    tables,
    missingEnv,
    envFile: envFileInfo(),
    services,
  }

  return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
