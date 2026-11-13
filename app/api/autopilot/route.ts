import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct } from '@/lib/products'
import { generateText, generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin'
import { adSystemPrompt, adPrompt, adStrictSuffix, buildAdScript } from '@/lib/adkit'

// Motore Autopilot di AhsenDS — Costruito da Ahsen Kurtoski
// Un solo clic: cerca prodotti reali su CJ, li analizza, li salva, scrive il
// pacchetto ad completo (script, sottotitoli, hashtag, descrizione), lo mette
// in coda e genera la landing page. Nessun contenuto finto: se l AI o CJ non
// rispondono, lo step viene marcato come non riuscito con il motivo reale.

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ELECTRONICS = [
  'wireless earbuds', 'smart watch', 'bluetooth speaker', 'phone accessory',
  'led strip light', 'mini projector', 'car charger gadget', 'usb hub',
  'gaming mouse', 'smart home device', 'power bank', 'webcam',
]

type Step = { id: string; label: string; status: 'ok' | 'error' | 'skipped'; message: string }

async function buildWebsite(name: string, category: string, price: number, image: string) {
  const system =
    'Sei un direttore creativo e front-end developer senior di una web agency di lusso. ' +
    'Generi landing page prodotto complete di livello premium in un SINGOLO file HTML autonomo. ' +
    'REGOLE: tutto il CSS in un tag style con variabili CSS (--brand colore principale); design responsive con media query; ' +
    'estetica costosa con gradienti, ombre morbide, bordi arrotondati, micro-animazioni e transizioni su hover; ' +
    'JavaScript vanilla in un tag script per menu mobile, smooth scroll, comparsa allo scroll con IntersectionObserver, FAQ a fisarmonica e un contatore offerta a tempo; ' +
    'meta tag SEO completi e favicon emoji inline; codice pulito e accessibile. ' +
    'Output: SOLO il codice HTML completo da <!doctype html> fino a </html>, senza markdown e senza spiegazioni.'
  const prompt =
    'Crea una landing page prodotto di altissimo livello (valore percepito 10000 euro), in ITALIANO, per vendere in dropshipping questo prodotto: "' + name + '". ' +
    'Prezzo di vendita: ' + price + ' euro. Categoria: ' + category + '. ' +
    (image ? 'Immagine reale del prodotto da usare nella hero e nella galleria: ' + image + '. ' : '') +
    'Colore brand principale: #7c5cff. ' +
    'Includi in ordine: header sticky con CTA, hero con immagine prodotto e bottone Acquista ora, barra vantaggi (spedizione, garanzia, pagamento sicuro), ' +
    'sezione benefici/caratteristiche a griglia, sezione come funziona in 3 step, galleria immagini, recensioni clienti con stelle e foto, ' +
    'offerta a tempo con contatore animato e urgenza, tabella o box prezzo con sconto e CTA, FAQ a fisarmonica, garanzia e resi, footer completo con attribuzione a AhsenDS (Costruito da Ahsen Kurtoski). ' +
    'Testi realistici e persuasivi orientati alla vendita. Deve sembrare il sito di un vero brand, non un template.'
  const raw = await generateText(system, prompt, 6000, { budgetMs: 90_000 })
  if (!raw) return null
  let html = raw.trim()
  if (html.indexOf('```') === 0) {
    html = html.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  }
  const lower = html.toLowerCase()
  const dt = lower.indexOf('<!doctype')
  const ht = lower.indexOf('<html')
  const begin = dt >= 0 ? dt : ht
  if (begin > 0) html = html.slice(begin)
  const complete = html.toLowerCase().indexOf('</html>') >= 0
  return { html, complete }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(8, Math.max(1, parseInt(searchParams.get('limit') || '6', 10) || 6))
  const keyword = q || ELECTRONICS[Math.floor(Math.random() * ELECTRONICS.length)]
  const page = 1 + Math.floor(Math.random() * 4)
  const steps: Step[] = []

  // 1) Prodotti reali da CJ
  const cj = await searchCjProducts({ keyword, pageSize: 30, pageNum: page })
  if (!cj.ok || cj.products.length === 0) {
    steps.push({
      id: 'products',
      label: 'Ricerca prodotti CJ',
      status: 'error',
      message: cj.error === 'no-credentials' ? 'Credenziali CJ mancanti' : cj.error || 'Nessun prodotto',
    })
    return NextResponse.json({
      ok: false,
      step: 'prodotti',
      keyword,
      steps,
      note:
        cj.error === 'no-credentials'
          ? 'Aggiungi CJ_EMAIL e CJ_API_KEY in .env.local per trovare prodotti reali. L Autopilot parte da li.'
          : 'Nessun prodotto trovato ora. Riprova o cambia parola chiave.',
      products: [],
    })
  }
  steps.push({
    id: 'products',
    label: 'Ricerca prodotti CJ',
    status: 'ok',
    message: cj.products.length + ' prodotti trovati su "' + keyword + '"',
  })

  // 2) Scoring e margini
  const base: BaseProduct[] = cj.products
  const scored = base.map((p) => {
    const s = scoreProduct(p.cost, p.popularity)
    const suggestedPrice = Math.round(p.cost * MARKUP * 100) / 100
    const margin = suggestedPrice > 0 ? Math.round(((suggestedPrice - p.cost) / suggestedPrice) * 100) : 0
    return { ...p, suggestedPrice, margin, score: s.score, label: s.label }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, limit)
  steps.push({
    id: 'scoring',
    label: 'Punteggio potenziale',
    status: 'ok',
    message: 'Miglior punteggio: ' + top[0].score + '/100 (' + top[0].label + ')',
  })

  // 3) Catalogo
  let saved = 0
  let savedNote = ''
  if (isSupabaseAdminConfigured) {
    try {
      const rows = top.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        supplier: 'CJ Dropshipping',
        cost: p.cost,
        price: p.suggestedPrice,
        status: 'active',
      }))
      const r = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'id' }).select('id')
      if (r.error) {
        savedNote = /schema cache|not find the table|does not exist|relation/i.test(r.error.message)
          ? 'Prodotti trovati ma non salvati: esegui supabase-schema.sql su Supabase.'
          : 'Prodotti non salvati: ' + r.error.message
        steps.push({ id: 'catalog', label: 'Salvataggio catalogo', status: 'error', message: savedNote })
      } else {
        saved = (r.data && r.data.length) || rows.length
        steps.push({ id: 'catalog', label: 'Salvataggio catalogo', status: 'ok', message: saved + ' prodotti salvati' })
      }
    } catch (e) {
      savedNote = 'Prodotti non salvati: ' + String(e).slice(0, 120)
      steps.push({ id: 'catalog', label: 'Salvataggio catalogo', status: 'error', message: savedNote })
    }
  } else {
    savedNote = 'Aggiungi Supabase (service role) per salvare i prodotti nel catalogo permanente.'
    steps.push({ id: 'catalog', label: 'Salvataggio catalogo', status: 'skipped', message: savedNote })
  }

  // 4) Pacchetto ad completo per il prodotto migliore
  const best = top[0]
  let ad: any = null
  let website: any = null
  let aiNote = ''
  let queueId: number | null = null

  if (aiConfigured() && best) {
    const request = {
      product: best.name,
      audience: best.category,
      tone: 'energico',
      platform: 'TikTok',
      price: best.suggestedPrice,
    }
    let data = await generateJson(adSystemPrompt(), adPrompt(request), { maxTokens: 2200, budgetMs: 70_000 })
    if (!data || !data.hook || !Array.isArray(data.scenes)) {
      data = await generateJson(adSystemPrompt(), adPrompt(request) + adStrictSuffix, {
        maxTokens: 2200,
        budgetMs: 70_000,
      })
    }
    ad = buildAdScript(data, request)
    steps.push(
      ad
        ? {
            id: 'ad',
            label: 'Ad completa',
            status: 'ok',
            message: ad.scenes.length + ' scene, ' + ad.hashtags.length + ' hashtag, sottotitoli pronti',
          }
        : {
            id: 'ad',
            label: 'Ad completa',
            status: 'error',
            message: 'L AI non ha restituito uno script valido, riprova.',
          }
    )

    website = await buildWebsite(best.name, best.category, best.suggestedPrice, best.image)
    steps.push(
      website
        ? {
            id: 'website',
            label: 'Landing page',
            status: 'ok',
            message: website.complete ? 'HTML completo' : 'HTML generato ma potrebbe essere incompleto',
          }
        : { id: 'website', label: 'Landing page', status: 'error', message: 'L AI non ha generato la landing' }
    )

    if (!ad && !website) aiNote = 'L AI non ha risposto: controlla le chiavi nella Diagnostica e riprova.'
  } else {
    aiNote = 'Aggiungi una chiave AI (Groq gratis) in .env.local per generare ad e sito automaticamente.'
    steps.push({ id: 'ad', label: 'Ad completa', status: 'skipped', message: 'Serve una chiave AI' })
    steps.push({ id: 'website', label: 'Landing page', status: 'skipped', message: 'Serve una chiave AI' })
  }

  // 5) Coda di pubblicazione: l'ad viene salvata davvero, non solo mostrata
  if (ad && isSupabaseAdminConfigured) {
    try {
      const r = await supabaseAdmin
        .from('ad_queue')
        .insert({
          product: best.name,
          platform: 'tiktok',
          title: ad.title || ad.hook,
          caption: ad.caption,
          hashtags: ad.hashtags.join(' '),
          status: 'queued',
        })
        .select('id')
        .single()
      if (r.error) {
        const missing = /schema cache|not find the table|does not exist|relation/i.test(r.error.message)
        steps.push({
          id: 'queue',
          label: 'Coda di pubblicazione',
          status: 'error',
          message: missing ? 'Tabella ad_queue mancante: esegui supabase-schema.sql.' : r.error.message,
        })
      } else {
        queueId = r.data && r.data.id ? r.data.id : null
        steps.push({ id: 'queue', label: 'Coda di pubblicazione', status: 'ok', message: 'Ad salvata in coda' })
      }
    } catch (e) {
      steps.push({ id: 'queue', label: 'Coda di pubblicazione', status: 'error', message: String(e).slice(0, 120) })
    }
  } else if (ad) {
    steps.push({ id: 'queue', label: 'Coda di pubblicazione', status: 'skipped', message: 'Serve Supabase' })
  }

  return NextResponse.json({
    ok: true,
    provider: aiProvider(),
    keyword,
    count: top.length,
    saved,
    savedNote,
    aiNote,
    steps,
    products: top,
    best: { product: best, ad, website, queueId },
    developer: 'Ahsen Kurtoski',
    note:
      'Autopilot completato: ' + top.length + ' prodotti analizzati, pacchetto ad e landing page generati per il migliore. ' +
      'Costruito da Ahsen Kurtoski.',
  })
}
