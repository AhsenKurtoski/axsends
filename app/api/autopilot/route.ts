import { NextResponse } from 'next/server'
import { searchCjProducts } from '@/lib/cj'
import { BaseProduct, MARKUP, scoreProduct } from '@/lib/products'
import { generateText, generateJson, aiConfigured, aiProvider } from '@/lib/ai'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Parole chiave elettronica/gadget: ruotano cosi ogni avvio trova cose diverse.
const ELECTRONICS = [
  'wireless earbuds', 'smart watch', 'bluetooth speaker', 'phone accessory',
  'led strip light', 'mini projector', 'car charger gadget', 'usb hub',
  'gaming mouse', 'smart home device', 'power bank', 'webcam',
]

function supabaseReady(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Coercizione sicura: l'AI a volte risponde con oggetti annidati o chiavi diverse.
function toText(v: any): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(' ')
  if (typeof v === 'object') {
    const keys = ['visual', 'scene', 'scena', 'text', 'description', 'descrizione', 'value', 'voiceover', 'azione']
    for (let i = 0; i < keys.length; i++) {
      if (v[keys[i]] != null) return toText(v[keys[i]])
    }
    return Object.values(v).map(toText).filter(Boolean).join(' ')
  }
  return ''
}
function toLines(v: any): string[] {
  if (v == null) return []
  if (Array.isArray(v)) return v.map(toText).filter(Boolean)
  const s = toText(v)
  return s ? [s] : []
}

async function buildAd(name: string, category: string, price: number) {
  const system = 'Sei un copywriter esperto di ads virali TikTok e Reels per e-commerce. Scrivi in italiano, diretto e persuasivo.'
  const prompt =
    'Crea una pubblicita breve e virale per questo prodotto: "' + name + '" (categoria ' + category + ', prezzo di vendita ' + price + ' euro). ' +
    'Restituisci SOLO un oggetto JSON con queste chiavi esatte: ' +
    'hook (stringa: una frase di apertura che ferma lo scroll), ' +
    'caption (stringa: didascalia pronta per il post con una call to action), ' +
    'hashtags (array di 8 stringhe, senza il simbolo cancelletto), ' +
    'script (array di 4 stringhe: ogni stringa una scena con i secondi e cosa mostrare o dire). ' +
    'Niente oggetti annidati, solo stringhe.'
  const raw = await generateJson(system, prompt)
  if (!raw) return null
  const hashtags = toLines(raw.hashtags)
  const script = toLines(raw.script)
  return {
    hook: toText(raw.hook) || ('Scopri ' + name),
    caption: toText(raw.caption) || ('Il prodotto che tutti vogliono: ' + name + '. Solo ' + price + ' euro.'),
    hashtags: hashtags.length ? hashtags : ['dropshipping', 'tiktokmademebuyit', 'gadget', 'tech', 'offerta', 'novita', 'fyp', 'shopping'],
    script: script.length ? script : [
      '0-3s: primo piano del prodotto in azione con musica trend',
      '3-7s: mostra il problema che risolve',
      '7-12s: il prodotto come soluzione, testo grande a schermo',
      '12-15s: prezzo e call to action Acquista ora',
    ],
  }
}

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
    'offerta a tempo con contatore animato e urgenza, tabella o box prezzo con sconto e CTA, FAQ a fisarmonica, garanzia e resi, footer completo. ' +
    'Testi realistici e persuasivi orientati alla vendita. Deve sembrare il sito di un vero brand, non un template.'
  const raw = await generateText(system, prompt, 8000)
  if (!raw) return null
  let html = raw.trim()
  if (html.indexOf('```') === 0) {
    html = html.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
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

  // 1) Trova prodotti reali su CJ
  const cj = await searchCjProducts({ keyword, pageSize: 30, pageNum: page })
  if (!cj.ok || cj.products.length === 0) {
    return NextResponse.json({
      ok: false,
      step: 'prodotti',
      keyword,
      note:
        cj.error === 'no-credentials'
          ? 'Aggiungi CJ_EMAIL e CJ_API_KEY in .env.local per trovare prodotti reali. L Autopilot parte da li.'
          : 'Nessun prodotto trovato ora. Riprova o cambia parola chiave.',
      products: [],
    })
  }

  const base: BaseProduct[] = cj.products
  const scored = base.map((p) => {
    const s = scoreProduct(p.cost, p.popularity)
    const suggestedPrice = Math.round(p.cost * MARKUP * 100) / 100
    const margin = suggestedPrice > 0 ? Math.round(((suggestedPrice - p.cost) / suggestedPrice) * 100) : 0
    return { ...p, suggestedPrice, margin, score: s.score, label: s.label }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, limit)

  // 2) Salva nel catalogo (best-effort, non blocca mai)
  let saved = 0
  let savedNote = ''
  if (supabaseReady()) {
    try {
      const rows = top.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        supplier: 'CJ Dropshipping',
        cost: p.cost,
        price: p.suggestedPrice,
        stock: 999,
        sold: 0,
        status: 'active',
      }))
      const r = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'id' }).select('id')
      if (r.error) {
        savedNote = /schema cache|not find the table|does not exist|relation/i.test(r.error.message)
          ? 'Prodotti trovati ma non salvati: esegui supabase-schema.sql su Supabase.'
          : 'Prodotti non salvati: ' + r.error.message
      } else {
        saved = (r.data && r.data.length) || rows.length
      }
    } catch (e) {
      savedNote = 'Prodotti non salvati: ' + String(e).slice(0, 120)
    }
  } else {
    savedNote = 'Aggiungi Supabase per salvare i prodotti nel catalogo permanente.'
  }

  // 3) + 4) Per il prodotto migliore: genera ad + landing page (serve una chiave AI)
  const best = top[0]
  let ad: any = null
  let website: any = null
  let aiNote = ''
  if (aiConfigured()) {
    ad = await buildAd(best.name, best.category, best.suggestedPrice)
    website = await buildWebsite(best.name, best.category, best.suggestedPrice, best.image)
    if (!ad && !website) aiNote = 'L AI non ha risposto, riprova tra poco.'
  } else {
    aiNote = 'Aggiungi una chiave AI (Groq gratis) in .env.local per generare ad e sito automaticamente.'
  }

  return NextResponse.json({
    ok: true,
    provider: aiProvider(),
    keyword,
    count: top.length,
    saved,
    savedNote,
    aiNote,
    products: top,
    best: { product: best, ad, website },
    note: 'Autopilot completato: ' + top.length + ' prodotti analizzati, ad e landing page generate per il migliore.',
  })
}
