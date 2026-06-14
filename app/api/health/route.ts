import { NextResponse } from 'next/server'
import { probeGroq, probeOpenRouter, probeGemini, type AiProbe } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { searchCjProducts } from '@/lib/cj'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

type Svc = {
  id: string
  name: string
  group: string
  powers: string
  status: 'ok' | 'error' | 'missing' | 'configured'
  message: string
}

function aiSvc(id: string, name: string, p: AiProbe): Svc {
  const powers = 'Descrizioni, ads, ebook, siti web, UGC, design'
  if (p.ok === null) return { id, name, group: 'AI (testi)', powers, status: 'missing', message: p.message }
  return { id, name, group: 'AI (testi)', powers, status: p.ok ? 'ok' : 'error', message: p.message }
}

async function checkSupabase(): Promise<Svc> {
  const base = { id: 'supabase', name: 'Supabase (database)', group: 'Infrastruttura', powers: 'Catalogo, ordini, fornitori, coda ads, login' }
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!configured) return { ...base, status: 'missing', message: 'Mancano NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY in .env.local.' }
  try {
    const r = await supabaseAdmin.from('products').select('id').limit(1)
    if (r.error) return { ...base, status: 'error', message: 'Connesso ma query fallita: ' + r.error.message + '. Hai eseguito supabase-schema.sql nel SQL Editor?' }
    return { ...base, status: 'ok', message: 'Connesso e tabelle raggiungibili.' }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di connessione: ' + String(e).slice(0, 160) }
  }
}

async function checkCj(): Promise<Svc> {
  const base = { id: 'cj', name: 'CJ Dropshipping', group: 'Prodotti', powers: 'Ricerca prodotti reali, Radar, import' }
  const configured = Boolean(process.env.CJ_ACCESS_TOKEN || (process.env.CJ_EMAIL && process.env.CJ_API_KEY))
  if (!configured) return { ...base, status: 'missing', message: 'Mancano CJ_EMAIL + CJ_API_KEY (oppure CJ_ACCESS_TOKEN) in .env.local.' }
  try {
    const r = await searchCjProducts({ pageSize: 1 })
    if (r.ok) return { ...base, status: 'ok', message: 'Autenticazione riuscita e prodotti raggiungibili.' }
    if (r.error === 'no-credentials') return { ...base, status: 'error', message: 'Credenziali non valide: controlla email e API Key in My CJ > Authorization > API.' }
    return { ...base, status: 'error', message: 'CJ ha risposto con errore: ' + String(r.error).slice(0, 160) }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkHf(): Promise<Svc> {
  const base = { id: 'hf', name: 'Hugging Face', group: 'Creativita', powers: 'Immagini e fotogrammi per le ads' }
  const token = process.env.HUGGINGFACE_API_TOKEN
  if (!token) return { ...base, status: 'missing', message: 'Manca HUGGINGFACE_API_TOKEN (opzionale, solo per le immagini).' }
  try {
    const r = await fetch('https://huggingface.co/api/whoami-v2', { headers: { Authorization: 'Bearer ' + token } })
    if (r.ok) return { ...base, status: 'ok', message: 'Token valido.' }
    return { ...base, status: 'error', message: 'Token non valido (HTTP ' + r.status + '). Rigeneralo su huggingface.co/settings/tokens.' }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkYouTube(): Promise<Svc> {
  const base = { id: 'youtube', name: 'YouTube', group: 'Pubblicazione', powers: 'Upload automatico video e Shorts' }
  const token = process.env.YOUTUBE_ACCESS_TOKEN
  if (!token) return { ...base, status: 'missing', message: 'Manca YOUTUBE_ACCESS_TOKEN in .env.local.' }
  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
      headers: { Authorization: 'Bearer ' + token },
    })
    if (r.ok) return { ...base, status: 'ok', message: 'Token valido e canale collegato.' }
    return { ...base, status: 'error', message: 'Token non valido o scaduto (HTTP ' + r.status + '). I token da OAuth Playground durano circa 1 ora: rigenerane uno nuovo.' }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkFacebook(): Promise<Svc> {
  const base = { id: 'facebook', name: 'Facebook Pages', group: 'Pubblicazione', powers: 'Post e video sulla tua Pagina' }
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FB_PAGE_ID
  if (!token || !pageId) return { ...base, status: 'missing', message: 'Mancano FACEBOOK_PAGE_ACCESS_TOKEN e/o FB_PAGE_ID.' }
  try {
    const r = await fetch('https://graph.facebook.com/v21.0/' + pageId + '?fields=name&access_token=' + token)
    const j: any = await r.json().catch(() => null)
    if (r.ok && j && j.name) return { ...base, status: 'ok', message: 'Collegato alla Pagina: ' + j.name + '.' }
    const msg = (j && j.error && j.error.message) || ('HTTP ' + r.status)
    return { ...base, status: 'error', message: 'Errore: ' + String(msg).slice(0, 160) }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

async function checkInstagram(): Promise<Svc> {
  const base = { id: 'instagram', name: 'Instagram', group: 'Pubblicazione', powers: 'Pubblicazione Reels e post' }
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUser = process.env.IG_USER_ID
  if (!token || !igUser) return { ...base, status: 'missing', message: 'Mancano INSTAGRAM_ACCESS_TOKEN e/o IG_USER_ID.' }
  try {
    const r = await fetch('https://graph.facebook.com/v21.0/' + igUser + '?fields=username&access_token=' + token)
    const j: any = await r.json().catch(() => null)
    if (r.ok && j && j.username) return { ...base, status: 'ok', message: 'Collegato all account: @' + j.username + '.' }
    const msg = (j && j.error && j.error.message) || ('HTTP ' + r.status)
    return { ...base, status: 'error', message: 'Errore: ' + String(msg).slice(0, 160) }
  } catch (e) {
    return { ...base, status: 'error', message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

function checkTikTok(): Svc {
  const base = { id: 'tiktok', name: 'TikTok', group: 'Pubblicazione', powers: 'Pubblicazione video (privato)' }
  const token = process.env.TIKTOK_ACCESS_TOKEN
  if (!token) return { ...base, status: 'missing', message: 'Manca TIKTOK_ACCESS_TOKEN. Richiede un app approvata con scope video.publish. Intanto puoi pubblicare a mano.' }
  return { ...base, status: 'configured', message: 'Token presente. La verifica completa avviene alla pubblicazione (serve app approvata da TikTok).' }
}

export async function GET() {
  const [groq, openrouter, gemini] = await Promise.all([probeGroq(), probeOpenRouter(), probeGemini()])
  const [supabase, cj, hf, youtube, facebook, instagram] = await Promise.all([
    checkSupabase(),
    checkCj(),
    checkHf(),
    checkYouTube(),
    checkFacebook(),
    checkInstagram(),
  ])
  const tiktok = checkTikTok()

  const services: Svc[] = [
    aiSvc('groq', 'Groq', groq),
    aiSvc('openrouter', 'OpenRouter', openrouter),
    aiSvc('gemini', 'Google Gemini', gemini),
    supabase,
    cj,
    hf,
    youtube,
    instagram,
    facebook,
    tiktok,
  ]

  const aiOk = [groq, openrouter, gemini].some((p) => p.ok === true)
  const summary = {
    aiOk,
    total: services.length,
    ok: services.filter((s) => s.status === 'ok').length,
    errors: services.filter((s) => s.status === 'error').length,
    missing: services.filter((s) => s.status === 'missing').length,
  }

  return NextResponse.json({ services, summary })
}
