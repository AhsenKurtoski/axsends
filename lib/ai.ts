// Generazione testo con AI reale: Groq (veloce e gratis) come primario,
// OpenRouter (modelli gratuiti potenti, limiti ampi) e Gemini come fallback.
// Nessun template: se almeno una chiave e presente, il testo e scritto dall'AI.
//
// I provider ritirano i modelli con una certa frequenza (Llama 3.3 e Gemini 2.0
// sono stati dismessi nel 2026). Per questo ogni provider ha una lista ordinata:
// si prova il modello scelto, poi i sostituti ufficiali. Quando uno funziona
// viene ricordato, cosi le chiamate successive non rifanno i tentativi.

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''

// Sostituti ufficiali dei modelli dismessi:
// - llama-3.3-70b-versatile -> openai/gpt-oss-120b (Groq, 16 ago 2026)
// - llama-3.3-70b-instruct:free -> nemotron-3-ultra (OpenRouter, catalogo cambiato)
// - gemini-2.0-flash -> gemini-3.8-flash (Google, 1 giu 2026)
const GROQ_FALLBACKS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
const OPENROUTER_FALLBACKS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'thinkingmachines/inkling-2-small:free',
]
const GEMINI_FALLBACKS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite']

let groqWorking: string | null = null
let openrouterWorking: string | null = null

function modelList(envValue: string | undefined, defaults: string[]): string[] {
  const list: string[] = []
  if (envValue) list.push(envValue)
  for (let i = 0; i < defaults.length; i++) {
    if (list.indexOf(defaults[i]) < 0) list.push(defaults[i])
  }
  return list
}

function ordered(list: string[], preferred: string | null): string[] {
  if (!preferred || list.indexOf(preferred) < 0) return list
  const rest = list.filter((m) => m !== preferred)
  return [preferred].concat(rest)
}

function groqModels(): string[] {
  return ordered(modelList(process.env.GROQ_MODEL, GROQ_FALLBACKS), groqWorking)
}

function openrouterModels(): string[] {
  return ordered(modelList(process.env.OPENROUTER_MODEL, OPENROUTER_FALLBACKS), openrouterWorking)
}

function geminiModels(): string[] {
  return modelList(process.env.GEMINI_MODEL, GEMINI_FALLBACKS)
}

function isGptOss(model: string): boolean {
  return model.indexOf('openai/gpt-oss') === 0
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
  const models = groqModels()
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const body: any = {
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }
      // I modelli GPT-OSS di Groq ragionano prima di rispondere: senza
      // reasoning_effort basso il budget finisce nel ragionamento e il testo
      // torna vuoto. max_completion_tokens e' il campo corretto per loro.
      if (isGptOss(model)) {
        body.reasoning_effort = 'low'
        if (maxTokens) body.max_completion_tokens = maxTokens
      } else if (maxTokens) {
        body.max_tokens = maxTokens
      }
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) continue
      const j: any = await r.json().catch(() => null)
      const text =
        j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content
      if (text && String(text).trim()) {
        groqWorking = model
        return String(text).trim()
      }
    } catch {
      // provo il modello successivo
    }
  }
  return null
}

async function callOpenRouter(system: string, prompt: string, maxTokens?: number): Promise<string | null> {
  if (!OPENROUTER_KEY) return null
  const models = openrouterModels()
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const body: any = {
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }
      if (maxTokens) body.max_tokens = maxTokens
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + OPENROUTER_KEY,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ahsends.app',
          'X-Title': 'AhsenDS',
        },
        body: JSON.stringify(body),
      })
      if (!r.ok) continue
      const j: any = await r.json().catch(() => null)
      const text =
        j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content
      if (text && String(text).trim()) {
        openrouterWorking = model
        return String(text).trim()
      }
    } catch {
      // provo il modello successivo
    }
  }
  return null
}

async function callGemini(system: string, prompt: string, maxTokens?: number): Promise<string | null> {
  if (!GEMINI_KEY) return null
  // Gemini 3.x non accetta piu i parametri di sampling: invio solo il limite
  // di output quando serve, cosi la stessa chiamata va bene su tutte le versioni.
  const genCfg: any = {}
  if (maxTokens) genCfg.maxOutputTokens = maxTokens
  const models = geminiModels()
  for (let i = 0; i < models.length; i++) {
    try {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent?key=' + GEMINI_KEY
      const body: any = {
        contents: [ { parts: [ { text: system + ' || ' + prompt } ] } ],
      }
      if (Object.keys(genCfg).length > 0) body.generationConfig = genCfg
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
  const models = groqModels()
  let lastMsg = ''
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const body: any = {
        model,
        max_tokens: 8,
        messages: [ { role: 'user', content: 'OK' } ],
      }
      if (isGptOss(model)) {
        body.reasoning_effort = 'low'
        body.max_completion_tokens = 8
        delete body.max_tokens
      }
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        groqWorking = model
        return { configured: true, ok: true, message: 'Funzionante (modello ' + model + ').' }
      }
      if (r.status === 429) {
        return { configured: true, ok: false, temporary: true, message: 'Limite richieste momentaneo (HTTP 429). La chiave e valida, riprova tra poco.' }
      }
      if (r.status === 401 || r.status === 403) {
        return { configured: true, ok: false, message: 'Chiave non valida o senza permessi (HTTP ' + r.status + '). Rigenerala su console.groq.com/keys.' }
      }
      const t = await r.text()
      lastMsg = 'HTTP ' + r.status + ' su ' + model + ': ' + t.slice(0, 140)
    } catch (e) {
      lastMsg = 'Errore di rete su ' + model + ': ' + String(e).slice(0, 120)
    }
  }
  return { configured: true, ok: false, message: 'Nessun modello Groq disponibile per questa chiave. Ultimo errore: ' + lastMsg }
}

export async function probeOpenRouter(): Promise<AiProbe> {
  if (!OPENROUTER_KEY) return { configured: false, ok: null, message: 'Chiave OPENROUTER_API_KEY non impostata.' }
  const models = openrouterModels()
  let lastMsg = ''
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + OPENROUTER_KEY,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ahsends.app',
          'X-Title': 'AhsenDS',
        },
        body: JSON.stringify({ model, max_tokens: 16, messages: [ { role: 'user', content: 'OK' } ] }),
      })
      if (r.ok) {
        openrouterWorking = model
        return { configured: true, ok: true, message: 'Funzionante (modello ' + model + ').' }
      }
      if (r.status === 429) {
        lastMsg = 'HTTP 429 su ' + model + ' (modello gratuito occupato)'
        continue
      }
      if (r.status === 401 || r.status === 403) {
        return { configured: true, ok: false, message: 'Chiave non valida o senza permessi (HTTP ' + r.status + '). Rigenerala su openrouter.ai/keys.' }
      }
      const t = await r.text()
      lastMsg = 'HTTP ' + r.status + ' su ' + model + ': ' + t.slice(0, 140)
    } catch (e) {
      lastMsg = 'Errore di rete su ' + model + ': ' + String(e).slice(0, 120)
    }
  }
  return { configured: true, ok: false, message: 'Nessun modello OpenRouter disponibile per questa chiave. Ultimo errore: ' + lastMsg }
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
      if (r.status === 401 || r.status === 403) {
        return { configured: true, ok: false, message: 'Chiave non valida o senza permessi (HTTP ' + r.status + '). Rigenerala su aistudio.google.com/app/apikey.' }
      }
      const t = await r.text()
      lastMsg = 'HTTP ' + r.status + ' su ' + models[i] + ': ' + t.slice(0, 120)
    } catch (e) {
      lastMsg = 'Errore di rete su ' + models[i] + ': ' + String(e).slice(0, 90)
    }
  }
  return { configured: true, ok: false, message: 'Nessun modello Gemini disponibile per questa chiave. Ultimo errore: ' + lastMsg }
}
