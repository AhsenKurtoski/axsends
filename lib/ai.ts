// Generazione testo con AI reale: Groq (veloce e gratis) come primario,
// OpenRouter (modelli gratuiti potenti) e Gemini come fallback.
// Nessun template: se almeno una chiave e' presente, il testo e' scritto dall'AI.
//
// DUE CHIAVI PER PROVIDER: ogni provider legge la chiave principale e una
// seconda chiave (GROQ_API_KEY_2, GEMINI_API_KEY_2, OPENROUTER_API_KEY_2). Se la
// prima e' in rate limit, scaduta o non valida, la stessa richiesta passa
// automaticamente alla seconda: il servizio non si ferma quando finisce il
// credito giornaliero di una chiave.
//
// I provider ritirano i modelli con una certa frequenza: per questo ogni
// provider ha una lista ordinata di sostituti ufficiali e il modello che
// funziona viene ricordato, cosi le chiamate successive non rifanno i tentativi.

type Provider = 'groq' | 'openrouter' | 'gemini'

// Sostituti ufficiali dei modelli dismessi:
// - llama-3.3-70b-versatile -> openai/gpt-oss-120b (Groq, ago 2026)
// - llama-3.3-70b-instruct:free -> nemotron-3-ultra (OpenRouter)
// - gemini-2.0-flash -> gemini-3.8-flash (Google, giu 2026); i modelli 2.5
//   flash-lite non sono piu' disponibili per i nuovi utenti (404)
const GROQ_FALLBACKS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']
const OPENROUTER_FALLBACKS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'thinkingmachines/inkling-2-small:free',
]
const GEMINI_FALLBACKS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
]

// Nomi delle variabili d'ambiente per ogni provider, in ordine di priorita'.
const KEY_NAMES: Record<Provider, string[]> = {
  groq: ['GROQ_API_KEY', 'GROQ_API_KEY_2', 'GROQ_API_KEY_3'],
  openrouter: ['OPENROUTER_API_KEY', 'OPENROUTER_API_KEY_2', 'OPENROUTER_API_KEY_3'],
  gemini: ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'],
}

const MODEL_ENV: Record<Provider, string> = {
  groq: 'GROQ_MODEL',
  openrouter: 'OPENROUTER_MODEL',
  gemini: 'GEMINI_MODEL',
}

const ATTEMPT_TIMEOUT_MS = 25_000
const DEFAULT_BUDGET_MS = 55_000

// Coppia modello+chiave che ha funzionato: viene provata per prima.
const working: Partial<Record<Provider, { model: string; keyIndex: number }>> = {}

// Le chiavi si leggono a ogni chiamata (non a import): cosi una nuova chiave
// impostata in .env.local viene usata senza riavviare il processo.
function keysFor(provider: Provider): string[] {
  const out: string[] = []
  const names = KEY_NAMES[provider]
  for (let i = 0; i < names.length; i++) {
    const raw = process.env[names[i]]
    const value = raw ? raw.trim() : ''
    if (value && out.indexOf(value) < 0) out.push(value)
  }
  return out
}

export function providerKeyCount(provider: Provider): number {
  return keysFor(provider).length
}

function modelList(envValue: string | undefined, defaults: string[]): string[] {
  const list: string[] = []
  const preferred = envValue ? envValue.trim() : ''
  if (preferred) list.push(preferred)
  for (let i = 0; i < defaults.length; i++) {
    if (list.indexOf(defaults[i]) < 0) list.push(defaults[i])
  }
  return list
}

// Mette per prima la coppia che ha gia' funzionato, senza cambiare l'ordine
// degli altri tentativi.
function preferredOrder(provider: Provider, models: string[], keys: string[]): { models: string[]; keys: string[] } {
  const w = working[provider]
  if (!w) return { models, keys }
  const mi = models.indexOf(w.model)
  const orderedModels = mi > 0 ? [models[mi]].concat(models.filter((_, i) => i !== mi)) : models
  const ki = w.keyIndex < keys.length ? w.keyIndex : -1
  const orderedKeys = ki > 0 ? [keys[ki]].concat(keys.filter((_, i) => i !== ki)) : keys
  return { models: orderedModels, keys: orderedKeys }
}

function isGptOss(model: string): boolean {
  return model.indexOf('openai/gpt-oss') === 0
}

export function aiConfigured(): boolean {
  return providerKeyCount('groq') > 0 || providerKeyCount('openrouter') > 0 || providerKeyCount('gemini') > 0
}

export function aiProvider(): string {
  if (providerKeyCount('groq') > 0) return 'groq'
  if (providerKeyCount('openrouter') > 0) return 'openrouter'
  if (providerKeyCount('gemini') > 0) return 'gemini'
  return 'none'
}

export function aiStatus() {
  const groqKeys = providerKeyCount('groq')
  const openrouterKeys = providerKeyCount('openrouter')
  const geminiKeys = providerKeyCount('gemini')
  return {
    groq: groqKeys > 0,
    openrouter: openrouterKeys > 0,
    gemini: geminiKeys > 0,
    groqKeys,
    openrouterKeys,
    geminiKeys,
    active: aiProvider(),
  }
}

type AttemptOpts = { maxTokens?: number; json: boolean; deadline: number }
type AttemptResult = { text: string | null; fatalModel?: boolean }

function textOf(j: any): string {
  const c = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content
  return c ? String(c).trim() : ''
}

async function groqOnce(model: string, key: string, system: string, prompt: string, o: AttemptOpts): Promise<AttemptResult> {
  const body: any = {
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
  }
  // I modelli GPT-OSS di Groq ragionano prima di rispondere: senza
  // reasoning_effort basso il budget finisce nel ragionamento e il testo torna
  // vuoto. max_completion_tokens e' il campo corretto per loro.
  if (isGptOss(model)) {
    body.reasoning_effort = 'low'
    if (o.maxTokens) body.max_completion_tokens = o.maxTokens
  } else if (o.maxTokens) {
    body.max_tokens = o.maxTokens
  }
  if (o.json) body.response_format = { type: 'json_object' }

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
  })
  if (r.status === 400 || r.status === 404) return { text: null, fatalModel: true }
  if (!r.ok) return { text: null }
  const j: any = await r.json().catch(() => null)
  const text = textOf(j)
  return { text: text || null }
}

async function callGroq(system: string, prompt: string, o: AttemptOpts): Promise<string | null> {
  const rawKeys = keysFor('groq')
  if (rawKeys.length === 0) return null
  const baseModels = modelList(process.env[MODEL_ENV.groq], GROQ_FALLBACKS)
  const { models, keys } = preferredOrder('groq', baseModels, rawKeys)

  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]
    for (let ki = 0; ki < keys.length; ki++) {
      if (Date.now() > o.deadline) return null
      try {
        const res = await groqOnce(model, keys[ki], system, prompt, o)
        if (res.text) {
          working.groq = { model, keyIndex: rawKeys.indexOf(keys[ki]) }
          return res.text
        }
        // Modello inesistente per questa chiave/piano: inutile provare le altre chiavi.
        if (res.fatalModel) break
      } catch {
        // timeout o rete: provo la chiave successiva
      }
    }
  }
  return null
}

async function openrouterOnce(model: string, key: string, system: string, prompt: string, o: AttemptOpts): Promise<AttemptResult> {
  const body: any = {
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
  }
  if (o.maxTokens) body.max_tokens = o.maxTokens
  if (o.json) body.response_format = { type: 'json_object' }

  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ahsends.app',
      'X-Title': 'AhsenDS',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
  })
  if (r.status === 400 || r.status === 404) return { text: null, fatalModel: true }
  if (!r.ok) return { text: null }
  const j: any = await r.json().catch(() => null)
  return { text: textOf(j) || null }
}

async function callOpenRouter(system: string, prompt: string, o: AttemptOpts): Promise<string | null> {
  const rawKeys = keysFor('openrouter')
  if (rawKeys.length === 0) return null
  const baseModels = modelList(process.env.OPENROUTER_MODEL, OPENROUTER_FALLBACKS)
  const { models, keys } = preferredOrder('openrouter', baseModels, rawKeys)

  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]
    for (let ki = 0; ki < keys.length; ki++) {
      if (Date.now() > o.deadline) return null
      try {
        const res = await openrouterOnce(model, keys[ki], system, prompt, o)
        if (res.text) {
          working.openrouter = { model, keyIndex: rawKeys.indexOf(keys[ki]) }
          return res.text
        }
        if (res.fatalModel) break
      } catch {
        // timeout o rete: provo la chiave successiva
      }
    }
  }
  return null
}

async function geminiOnce(model: string, key: string, system: string, prompt: string, o: AttemptOpts): Promise<AttemptResult> {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key)
  // systemInstruction e' il canale corretto per le istruzioni di sistema; il
  // prompt utente resta separato.
  const body: any = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  }
  const genCfg: any = {}
  if (o.maxTokens) genCfg.maxOutputTokens = o.maxTokens
  if (o.json) genCfg.responseMimeType = 'application/json'
  if (Object.keys(genCfg).length > 0) body.generationConfig = genCfg

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
  })
  if (r.status === 400 || r.status === 404) return { text: null, fatalModel: true }
  if (!r.ok) return { text: null }
  const j: any = await r.json().catch(() => null)
  const cand = j && j.candidates && j.candidates[0]
  const parts = (cand && cand.content && cand.content.parts) || []
  let text = ''
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i] && parts[i].text
    if (t) text += String(t)
  }
  return { text: text.trim() || null }
}

async function callGemini(system: string, prompt: string, o: AttemptOpts): Promise<string | null> {
  const rawKeys = keysFor('gemini')
  if (rawKeys.length === 0) return null
  const baseModels = modelList(process.env.GEMINI_MODEL, GEMINI_FALLBACKS)
  const { models, keys } = preferredOrder('gemini', baseModels, rawKeys)

  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]
    for (let ki = 0; ki < keys.length; ki++) {
      if (Date.now() > o.deadline) return null
      try {
        const res = await geminiOnce(model, keys[ki], system, prompt, o)
        if (res.text) {
          working.gemini = { model, keyIndex: rawKeys.indexOf(keys[ki]) }
          return res.text
        }
        if (res.fatalModel) break
      } catch {
        // timeout o rete: provo la chiave successiva
      }
    }
  }
  return null
}

export type GenerateOptions = { maxTokens?: number; json?: boolean; budgetMs?: number }

// Genera testo libero. Prova Groq, poi OpenRouter, poi Gemini (due chiavi per
// provider). Null se nessuna chiave o se tutti i tentativi falliscono.
export async function generateText(
  system: string,
  prompt: string,
  maxTokens?: number,
  opts?: GenerateOptions
): Promise<string | null> {
  const budget = opts && opts.budgetMs ? opts.budgetMs : DEFAULT_BUDGET_MS
  const o: AttemptOpts = {
    maxTokens: maxTokens || (opts && opts.maxTokens),
    json: Boolean(opts && opts.json),
    deadline: Date.now() + budget,
  }
  const stages = [callGroq, callOpenRouter, callGemini]
  for (let i = 0; i < stages.length; i++) {
    if (Date.now() > o.deadline) break
    const out = await stages[i](system, prompt, o)
    if (out) return out
  }
  return null
}

// Genera e fa il parse di un oggetto/array JSON prodotto dall'AI. Pulisce eventuali code fence.
export async function generateJson(system: string, prompt: string, opts?: GenerateOptions): Promise<any> {
  const raw = await generateText(
    system + ' Rispondi SOLO con JSON valido, senza testo extra e senza markdown.',
    prompt,
    opts && opts.maxTokens,
    { json: true, budgetMs: opts && opts.budgetMs }
  )
  if (!raw) return null
  return parseJsonLoosely(raw)
}

// L'AI a volte incapsula il JSON in testo o code fence: proviamo le strade
// piu' comuni prima di arrenderci.
export function parseJsonLoosely(raw: string): any {
  let s = String(raw).trim()
  if (s.indexOf('```') === 0) {
    s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
  }
  try {
    return JSON.parse(s)
  } catch {
    // continua con l'estrazione
  }
  const objStart = s.indexOf('{')
  const arrStart = s.indexOf('[')
  let begin = objStart
  if (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) begin = arrStart
  if (begin > 0) s = s.slice(begin)
  const lastObj = s.lastIndexOf('}')
  const lastArr = s.lastIndexOf(']')
  const end = Math.max(lastObj, lastArr)
  if (end > 0 && end < s.length - 1) s = s.slice(0, end + 1)
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// --- Diagnostica: prova ogni provider AI e restituisce un messaggio di errore specifico ---

export type AiProbe = { configured: boolean; ok: boolean | null; temporary?: boolean; message: string }

async function probeProvider(provider: Provider): Promise<AiProbe> {
  const keys = keysFor(provider)
  const label = provider === 'gemini' ? 'Gemini' : provider === 'groq' ? 'Groq' : 'OpenRouter'
  if (keys.length === 0) {
    const env = provider === 'gemini' ? 'GEMINI_API_KEY' : provider === 'groq' ? 'GROQ_API_KEY' : 'OPENROUTER_API_KEY'
    return { configured: false, ok: null, message: 'Chiave ' + env + ' non impostata.' }
  }

  const system = 'Rispondi solo con la parola OK.'
  const prompt = 'Scrivi: OK'
  const models = modelList(process.env[MODEL_ENV[provider]], provider === 'groq' ? GROQ_FALLBACKS : provider === 'gemini' ? GEMINI_FALLBACKS : OPENROUTER_FALLBACKS)
  const o: AttemptOpts = { maxTokens: 16, json: false, deadline: Date.now() + 20_000 }

  let lastError = ''
  let rateLimited = 0
  for (let mi = 0; mi < models.length; mi++) {
    const model = models[mi]
    for (let ki = 0; ki < keys.length; ki++) {
      const keyLabel = 'chiave ' + (ki + 1) + '/' + keys.length
      try {
        let res: AttemptResult
        if (provider === 'groq') res = await groqOnce(model, keys[ki], system, prompt, o)
        else if (provider === 'openrouter') res = await openrouterOnce(model, keys[ki], system, prompt, o)
        else res = await geminiOnce(model, keys[ki], system, prompt, o)

        if (res.text) {
          working[provider] = { model, keyIndex: ki }
          return {
            configured: true,
            ok: true,
            message:
              'Funzionante (modello ' + model + ', ' + keyLabel + ').' +
              (keys.length > 1 ? ' Seconda chiave pronta come riserva.' : ''),
          }
        }
        if (res.fatalModel) {
          lastError = 'modello ' + model + ' non disponibile'
          break
        }
        rateLimited++
        lastError = 'risposta vuota o non valida da ' + model + ' (' + keyLabel + ')'
      } catch {
        rateLimited++
        lastError = 'errore di rete o timeout su ' + model + ' (' + keyLabel + ')'
      }
      if (Date.now() > o.deadline) break
    }
    if (Date.now() > o.deadline) break
  }

  if (rateLimited > 0) {
    return {
      configured: true,
      ok: false,
      temporary: true,
      message:
        label + ': limite richieste o servizio occupato su tutti i tentativi. ' + lastError + '. Riprova tra poco.',
    }
  }
  return {
    configured: true,
    ok: false,
    message: label + ': nessun modello disponibile per queste chiavi. Ultimo errore: ' + lastError,
  }
}

export async function probeGroq(): Promise<AiProbe> {
  return probeProvider('groq')
}

export async function probeOpenRouter(): Promise<AiProbe> {
  return probeProvider('openrouter')
}

export async function probeGemini(): Promise<AiProbe> {
  return probeProvider('gemini')
}
