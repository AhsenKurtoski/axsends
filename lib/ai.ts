// Generazione testo con AI reale: Groq (veloce e gratis) come primario,
// OpenRouter (modelli gratuiti potenti, limiti ampi) e Gemini come fallback.
// Nessun template: se almeno una chiave e presente, il testo e scritto dall'AI.

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free'

// Lista di modelli Gemini da provare in ordine: prima quello scelto (se presente),
// poi modelli noti e attuali. Cosi anche un GEMINI_MODEL vecchio (es. 1.5-flash) si
// auto-corregge cadendo su un modello valido.
function geminiModels(): string[] {
  const list: string[] = []
  if (process.env.GEMINI_MODEL) list.push(process.env.GEMINI_MODEL)
  const defaults = ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-1.5-flash-latest', 'gemini-1.5-flash']
  for (let i = 0; i < defaults.length; i++) {
    if (list.indexOf(defaults[i]) < 0) list.push(defaults[i])
  }
  return list
}

export function aiConfigured(): boolean {
  return Boolean(GROQ_KEY || OPENROUTER_KEY || GEMINI_KEY)
}

export function aiProvider(): string {
  if (GROQ_KEY) return 'groq'
  if (OPENROUTER_KEY) return 'openrouter'
  if (GEMINI_KEY) return 'gemini'
  return 'none'
}

export function aiStatus() {
  return {
    groq: Boolean(GROQ_KEY),
    openrouter: Boolean(OPENROUTER_KEY),
    gemini: Boolean(GEMINI_KEY),
    active: aiProvider(),
  }
}

async function callGroq(system: string, prompt: string, maxTokens?: number): Promise<string | null> {
  if (!GROQ_KEY) return null
  try {
    const body: any = {
      model: GROQ_MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }
    if (maxTokens) body.max_tokens = maxTokens
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null
    const j: any = await r.json().catch(() => null)
    const text =
      j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content
    return text ? String(text).trim() : null
  } catch {
    return null
  }
}

async function callOpenRouter(system: string, prompt: string, maxTokens?: number): Promise<string | null> {
  if (!OPENROUTER_KEY) return null
  try {
    const body: any = {
      model: OPENROUTER_MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }
    if (maxTokens) body.max_tokens = maxTokens
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + OPENROUTER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null
    const j: any = await r.json().catch(() => null)
    const text =
      j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content
    return text ? String(text).trim() : null
  } catch {
    return null
  }
}

async function callGemini(system: string, prompt: string, maxTokens?: number): Promise<string | null> {
  if (!GEMINI_KEY) return null
  const genCfg: any = { temperature: 0.8 }
  if (maxTokens) genCfg.maxOutputTokens = maxTokens
  const models = geminiModels()
  for (let i = 0; i < models.length; i++) {
    try {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + GEMINI_KEY
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [ { parts: [ { text: system + ' || ' + prompt } ] } ],
          generationConfig: genCfg,
        }),
      })
      if (!r.ok) continue
      const j: any = await r.json().catch(() => null)
      const cand = j && j.candidates && j.candidates[0]
      const part = cand && cand.content && cand.content.parts && cand.content.parts[0]
      const text = part && part.text
      if (text) return String(text).trim()
    } catch {
      // provo il modello successivo
    }
  }
  return null
}

// Genera testo libero. Prova Groq, poi OpenRouter, poi Gemini. Null se nessuna chiave o errore.
// maxTokens opzionale per output lunghi (es. siti web completi).
export async function generateText(system: string, prompt: string, maxTokens?: number): Promise<string | null> {
  const viaGroq = await callGroq(system, prompt, maxTokens)
  if (viaGroq) return viaGroq
  const viaOpenRouter = await callOpenRouter(system, prompt, maxTokens)
  if (viaOpenRouter) return viaOpenRouter
  return await callGemini(system, prompt, maxTokens)
}

// Genera e fa il parse di un oggetto/array JSON prodotto dall'AI. Pulisce eventuali code fence.
export async function generateJson(system: string, prompt: string): Promise<any> {
  const raw = await generateText(
    system + ' Rispondi SOLO con JSON valido, senza testo extra e senza markdown.',
    prompt
  )
  if (!raw) return null
  let s = raw.trim()
  if (s.indexOf('```') === 0) {
    s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
  }
  const objStart = s.indexOf('{')
  const arrStart = s.indexOf('[')
  let begin = objStart
  if (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) begin = arrStart
  if (begin > 0) s = s.slice(begin)
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// --- Diagnostica: prova ogni provider AI e restituisce un messaggio di errore specifico ---

export type AiProbe = { configured: boolean; ok: boolean | null; temporary?: boolean; message: string }

export async function probeGroq(): Promise<AiProbe> {
  if (!GROQ_KEY) return { configured: false, ok: null, message: 'Chiave GROQ_API_KEY non impostata.' }
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 5, messages: [ { role: 'user', content: 'OK' } ] }),
    })
    if (r.ok) return { configured: true, ok: true, message: 'Funzionante (modello ' + GROQ_MODEL + ').' }
    if (r.status === 429) return { configured: true, ok: false, temporary: true, message: 'Limite richieste momentaneo (HTTP 429). La chiave e valida, riprova tra poco.' }
    const t = await r.text()
    return { configured: true, ok: false, message: 'Errore HTTP ' + r.status + ': ' + t.slice(0, 160) }
  } catch (e) {
    return { configured: true, ok: false, message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

export async function probeOpenRouter(): Promise<AiProbe> {
  if (!OPENROUTER_KEY) return { configured: false, ok: null, message: 'Chiave OPENROUTER_API_KEY non impostata.' }
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + OPENROUTER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OPENROUTER_MODEL, max_tokens: 5, messages: [ { role: 'user', content: 'OK' } ] }),
    })
    if (r.ok) return { configured: true, ok: true, message: 'Funzionante (modello ' + OPENROUTER_MODEL + ').' }
    if (r.status === 429) return { configured: true, ok: false, temporary: true, message: 'Modello gratuito momentaneamente occupato (HTTP 429). La chiave e valida: riprova piu tardi o usa Groq (gia attivo).' }
    const t = await r.text()
    return { configured: true, ok: false, message: 'Errore HTTP ' + r.status + ': ' + t.slice(0, 160) }
  } catch (e) {
    return { configured: true, ok: false, message: 'Errore di rete: ' + String(e).slice(0, 140) }
  }
}

export async function probeGemini(): Promise<AiProbe> {
  if (!GEMINI_KEY) return { configured: false, ok: null, message: 'Chiave GEMINI_API_KEY non impostata.' }
  const models = geminiModels()
  let lastMsg = ''
  for (let i = 0; i < models.length; i++) {
    try {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + GEMINI_KEY
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [ { parts: [ { text: 'OK' } ] } ] }),
      })
      if (r.ok) return { configured: true, ok: true, message: 'Funzionante (modello ' + models[i] + ').' }
      if (r.status === 429) return { configured: true, ok: false, temporary: true, message: 'Limite richieste momentaneo (HTTP 429). La chiave e valida, riprova tra poco.' }
      const t = await r.text()
      lastMsg = 'HTTP ' + r.status + ' su ' + models[i] + ': ' + t.slice(0, 100)
    } catch (e) {
      lastMsg = 'Errore di rete su ' + models[i] + ': ' + String(e).slice(0, 90)
    }
  }
  return { configured: true, ok: false, message: 'Nessun modello Gemini disponibile per questa chiave. Ultimo errore: ' + lastMsg }
}
