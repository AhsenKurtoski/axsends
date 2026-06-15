import { NextResponse } from 'next/server'
import { generateText, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Genera un sito web premium, multi-sezione, di livello agenzia (5000-10000 euro),
// in un singolo file HTML autonomo pronto da vendere o pubblicare.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const business = (b && b.business ? String(b.business) : 'Attivita locale').trim()
  const type = (b && b.type ? String(b.type) : 'sito vetrina').trim()
  const style = (b && b.style ? String(b.style) : 'moderno e premium').trim()
  const color = (b && b.color ? String(b.color) : '#7c5cff').trim()
  const language = (b && b.language ? String(b.language) : 'Italiano').trim()
  const goal = (b && b.goal ? String(b.goal) : 'Generazione contatti').trim()
  const contact = (b && b.contact ? String(b.contact) : '').trim()
  const images = b && b.images === false ? false : true

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi una chiave AI (Groq/OpenRouter/Gemini) in .env.local, poi riprova.',
      html: null,
    })
  }

  const sections = [
    'header sticky con logo testuale e menu ad ancore con smooth scroll e menu hamburger mobile funzionante',
    'hero a tutta altezza con titolo forte, sottotitolo persuasivo, due bottoni CTA e sfondo a gradiente elegante',
    'striscia di punti di forza con icone (badge di fiducia)',
    'sezione servizi/offerta a griglia con card animate in hover',
    'sezione chi siamo con testo e immagine affiancati',
    'sezione numeri/statistiche con contatori animati',
    'galleria immagini a griglia',
    'sezione testimonianze clienti con foto, nome e stelle',
    'tabella prezzi con 3 piani e piano centrale evidenziato',
    'FAQ a fisarmonica usando tag details e summary',
    'sezione CTA finale a tutta larghezza con sfondo colorato',
    'form contatti completo (nome, email, telefono, messaggio) con validazione base',
    'footer ricco con contatti, link rapidi, social e copyright',
  ]

  const system =
    'Sei un direttore creativo e front-end developer senior di una web agency di lusso. ' +
    'Generi siti web completi di livello premium in un SINGOLO file HTML autonomo. ' +
    'REGOLE TECNICHE: tutto il CSS dentro un tag style usando variabili CSS (in particolare --brand per il colore principale); ' +
    'design totalmente responsive con media query per mobile; tipografia elegante con Google Fonts via tag link (es. Poppins o Inter); ' +
    'estetica moderna e costosa: gradienti, ombre morbide, bordi arrotondati, spaziature ampie, micro-animazioni e transizioni su hover, effetti glass; ' +
    'JavaScript vanilla dentro un tag script per: menu hamburger mobile, smooth scroll, comparsa degli elementi allo scroll con IntersectionObserver, contatori animati e gestione FAQ; ' +
    'meta tag SEO completi (title, description, Open Graph) e favicon emoji inline; codice pulito, semantico e accessibile. ' +
    'Output: SOLO il codice HTML completo da <!doctype html> fino a </html>, senza markdown e senza spiegazioni.'

  const prompt =
    'Crea un sito web di altissimo livello, da agenzia premium (valore percepito 5000-10000 euro), per questa attivita: "' + business + '". ' +
    'Tipo di sito: ' + type + '. Stile visivo: ' + style + '. Colore principale del brand: ' + color + '. ' +
    'Lingua di TUTTI i testi: ' + language + '. Obiettivo principale del sito: ' + goal + '. ' +
    (contact ? 'Usa questi contatti reali nel sito e nel footer: ' + contact + '. ' : '') +
    (images
      ? 'Usa immagini reali tramite URL nel formato https://picsum.photos/seed/PAROLA/1200/800 (cambia PAROLA per ogni immagine, coerente col settore) per hero, galleria, chi siamo e foto testimonianze. '
      : 'Non usare immagini esterne: crea profondita con gradienti, forme geometriche, icone ed emoji. ') +
    'Includi TUTTE queste sezioni nell ordine indicato: ' + sections.join('; ') + '. ' +
    'Scrivi testi realistici, specifici per il settore e persuasivi, con call to action chiare orientate a: ' + goal + '. ' +
    'Il risultato deve sembrare un sito vero di una grande azienda, non un template.'

  const raw = await generateText(system, prompt, 8000)
  if (!raw) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco (a volte basta ripremere Genera).',
      html: null,
    })
  }

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

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    complete,
    note: complete
      ? 'Sito premium generato con AI (' + aiProvider() + ').'
      : 'Sito generato ma potrebbe essere incompleto: ripremi Genera per una versione completa.',
    html,
  })
}
