import { NextResponse } from 'next/server'
import { generateText, aiConfigured, aiProvider } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Genera un sito web completo e premium in un singolo file HTML, pronto da vendere o pubblicare.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const business = (b && b.business ? String(b.business) : 'Attivita locale').trim()
  const type = (b && b.type ? String(b.type) : 'sito vetrina').trim()
  const style = (b && b.style ? String(b.style) : 'moderno e premium').trim()

  if (!aiConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'none',
      note: 'Aggiungi una chiave AI (Groq/OpenRouter/Gemini) in .env.local.',
      html: null,
    })
  }

  const system =
    'Sei un web designer e front-end developer senior. Generi siti web completi, moderni e premium in un SINGOLO file HTML con CSS dentro un tag style. Niente librerie esterne, design responsive, palette elegante, sezioni: header con menu, hero con call to action, servizi, gallery/feature, testimonianze, sezione contatti con form, footer. Output: SOLO codice HTML completo da DOCTYPE a html di chiusura, senza markdown e senza spiegazioni.'
  const prompt =
    'Crea un sito web premium per: "' + business + '". Tipo: ' + type + '. Stile: ' + style + '. ' +
    'In italiano, con testi realistici e persuasivi e una call to action chiara. ' +
    'Deve sembrare fatto da un professionista pagato 500 euro.'

  const raw = await generateText(system, prompt)
  if (!raw) {
    return NextResponse.json({
      configured: true,
      provider: aiProvider(),
      note: 'L AI non ha risposto correttamente, riprova tra poco.',
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

  return NextResponse.json({
    configured: true,
    provider: aiProvider(),
    note: 'Sito generato con AI (' + aiProvider() + ').',
    html,
  })
}
