import { z } from 'zod'

// Schemi di validazione per le API routes di AhsenDS.
// Costruito da Ahsen Kurtoski.
// Un input non valido viene respinto con 400 prima di toccare il database.

// --- Ricerca prodotti ---
export const researchQuerySchema = z
  .object({
    q: z.string().max(300).optional(),
    sort: z.enum(['score', 'trending', 'margin']).optional(),
    page: z.coerce.number().int().min(0).max(100).optional(),
    t: z.string().optional(),
  })
  .passthrough()

// --- Import prodotti ---
export const importItemSchema = z.object({
  externalId: z.string().min(1).max(100),
  name: z.string().min(1).max(300),
  cost: z.number().positive(),
  image: z.string().max(1000).optional(),
  supplier: z.string().max(100).optional(),
  stock: z.number().int().min(0).max(999999).optional(),
})

export const importBodySchema = z.object({
  items: z.array(importItemSchema).min(1).max(100),
})

// --- Ordini ---
export const orderBodySchema = z.object({
  id: z.string().min(1).max(80).optional(),
  product: z.string().min(1).max(300),
  customer: z.string().min(1).max(200),
  total: z.number().positive(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  date: z.string().max(30).optional(),
})

// --- Generazione AD ---
export const generateAdBodySchema = z.object({
  product: z.string().min(1).max(300),
  audience: z.string().max(300).optional(),
  tone: z.string().max(100).optional(),
  platform: z.string().max(100).optional(),
  price: z.union([z.string().max(50), z.number()]).optional(),
})

// --- Generazione video/fotogrammi ---
export const generateVideoBodySchema = z.object({
  prompt: z.string().max(1000).optional().default(''),
  product: z.string().max(300).optional(),
  scenes: z
    .array(
      z.union([
        z.string(),
        z.object({
          time: z.string().max(50).optional(),
          visual: z.string().max(1000).optional(),
          voiceover: z.string().max(1000).optional(),
        }).passthrough(),
      ])
    )
    .max(20)
    .optional(),
})

// --- Pubblicazione TikTok ---
export const tiktokBodySchema = z.object({
  videoUrl: z.string().url().max(2000),
  caption: z.string().max(2200).optional(),
})

// --- Pubblicazione YouTube ---
export const youtubeBodySchema = z.object({
  videoUrl: z.string().url().max(2000),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  privacy: z.enum(['private', 'unlisted', 'public']).optional(),
})

// --- Affiliate ---
export const affiliateBodySchema = z.object({
  product: z.string().min(1).max(300),
  platform: z.string().max(100).optional(),
  network: z.string().max(100).optional(),
  link: z.string().max(2000).optional(),
  tone: z.string().max(100).optional(),
})

// --- Descrizione prodotto ---
export const describeBodySchema = z.object({
  product: z.string().min(1).max(300).optional(),
  name: z.string().min(1).max(300).optional(),
  category: z.string().max(100).optional(),
  features: z.array(z.string().max(300)).max(20).optional(),
  tone: z.string().max(100).optional(),
  price: z.union([z.string().max(50), z.number()]).optional(),
})

// --- Coda di pubblicazione ---
export const adQueueBodySchema = z.object({
  product: z.string().min(1).max(300),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'facebook']).optional(),
  title: z.string().max(300).optional(),
  caption: z.string().max(5000).optional(),
  hashtags: z.string().max(2000).optional(),
  videoUrl: z.union([z.string().url().max(2000), z.literal('')]).optional(),
  status: z.enum(['queued', 'scheduled', 'published', 'failed']).optional(),
  scheduledAt: z.string().max(40).optional().nullable(),
})

// --- Impostazioni app ---
export const settingsBodySchema = z.object({
  key: z.string().min(1).max(100),
  value: z.record(z.string(), z.any()),
})

// --- Login/registrazione ---
export const authBodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(100),
})

// --- Helper: valida il body JSON di una richiesta ---
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { success: false, error: 'Body JSON non valido' }
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const parts = result.error.issues.map((i) => {
      const path = i.path.join('.')
      return path ? path + ': ' + i.message : i.message
    })
    return { success: false, error: 'Validazione fallita: ' + parts.join('; ') }
  }
  return { success: true, data: result.data }
}

// --- Helper: valida i query parameters di una richiesta ---
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  const result = schema.safeParse(params)
  if (!result.success) {
    const parts = result.error.issues.map((i) => {
      const path = i.path.join('.')
      return path ? path + ': ' + i.message : i.message
    })
    return { success: false, error: 'Validazione query fallita: ' + parts.join('; ') }
  }
  return { success: true, data: result.data }
}
