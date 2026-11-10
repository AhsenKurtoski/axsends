// Generazione immagini con Hugging Face Inference.
// Prova prima il router ufficiale (endpoint attuale) e poi il vecchio host
// api-inference: cosi' il token continua a funzionare anche se uno dei due
// endpoint cambia. Nessuna immagine finta: se nessuno risponde, ritorna null.

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ''
const IMAGE_MODEL = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'

export function hfConfigured(): boolean {
  return Boolean(HF_TOKEN)
}

export function hfImageModel(): string {
  return IMAGE_MODEL
}

export async function generateImage(prompt: string): Promise<string | null> {
  if (!HF_TOKEN) return null

  const endpoints = [
    'https://router.huggingface.co/hf-inference/models/' + IMAGE_MODEL,
    'https://api-inference.huggingface.co/models/' + IMAGE_MODEL,
  ]

  for (let i = 0; i < endpoints.length; i++) {
    try {
      const r = await fetch(endpoints[i], {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + HF_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      })
      if (!r.ok) continue
      // Hugging Face a volte risponde 200 con un JSON di errore: accettiamo
      // solo risposte che sono davvero un'immagine.
      const type = r.headers.get('content-type') || ''
      if (type.indexOf('image/') !== 0) continue
      const buf = Buffer.from(await r.arrayBuffer())
      return 'data:' + type.split(';')[0] + ';base64,' + buf.toString('base64')
    } catch {
      // provo l'endpoint successivo
    }
  }

  return null
}
