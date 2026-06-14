// Generazione testo con AI reale: Groq (veloce e gratis) come primario, Gemini come fallback.
// Nessun template: se almeno una chiave e presente, il testo e scritto dall'AI.

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

export function aiConfigured(): boolean {
  return Boolean(GROQ_KEY || GEMINI_KEY)
}

export function aiProvider(): string {
  if (GROQ_KEY) return 'groq'
  if (GEMINI_KEY) return 'gemini'
  return 'none'
}

async function callGroq(system: string, prompt: string): Promise<string | null> {
  if (!GROQ_KEY) return null
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.8,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
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

async function callGemini(system: string, prompt: string): Promise<string | null> {
  if (!GEMINI_KEY) return null
  try {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      GEMINI_MODEL +
      ':generateContent?key=' +
      GEMINI_KEY
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [ { parts: [ { text: system + ' || ' + prompt } ] } ],
        generationConfig: { temperature: 0.8 },
      }),
    })
    if (!r.ok) return null
    const j: any = await r.json().catch(() => null)
    const cand = j && j.candidates && j.candidates[0]
    const part = cand && cand.content && cand.content.parts && cand.content.parts[0]
    const text = part && part.text
    return text ? String(text).trim() : null
  } catch {
    return null
  }
}

// Genera testo libero. Prova prima Groq, poi Gemini. Null se nessuna chiave o errore.
export async function generateText(system: string, prompt: string): Promise<string | null> {
  const viaGroq = await callGroq(system, prompt)
  if (viaGroq) return viaGroq
  return await callGemini(system, prompt)
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
