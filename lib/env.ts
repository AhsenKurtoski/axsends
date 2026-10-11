// Validazione delle variabili d'ambiente.
// Non blocca l'avvio in sviluppo, ma dice in chiaro cosa manca.

export type EnvItem = {
  key: string
  label: string
  required: boolean
  present: boolean
}

const ENV_SPEC: Array<{ key: string; label: string; required: boolean }> = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase anon key', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service role key', required: true },
  { key: 'GROQ_API_KEY', label: 'Groq (AI testi)', required: false },
  { key: 'OPENROUTER_API_KEY', label: 'OpenRouter (AI testi)', required: false },
  { key: 'GEMINI_API_KEY', label: 'Gemini (AI testi)', required: false },
  { key: 'CJ_EMAIL', label: 'CJ Dropshipping email', required: false },
  { key: 'CJ_API_KEY', label: 'CJ Dropshipping API key', required: false },
  { key: 'CJ_ACCESS_TOKEN', label: 'CJ access token (alternativa)', required: false },
  { key: 'HUGGINGFACE_API_TOKEN', label: 'Hugging Face token', required: false },
  { key: 'TIKTOK_ACCESS_TOKEN', label: 'TikTok access token', required: false },
  { key: 'YOUTUBE_ACCESS_TOKEN', label: 'YouTube access token', required: false },
  { key: 'FACEBOOK_PAGE_ACCESS_TOKEN', label: 'Facebook page token', required: false },
  { key: 'FB_PAGE_ID', label: 'Facebook page id', required: false },
  { key: 'INSTAGRAM_ACCESS_TOKEN', label: 'Instagram access token', required: false },
  { key: 'IG_USER_ID', label: 'Instagram user id', required: false },
  { key: 'CRON_SECRET', label: 'Secret per i cron Vercel', required: false },
]

export function envItems(): EnvItem[] {
  return ENV_SPEC.map((s) => ({
    key: s.key,
    label: s.label,
    required: s.required,
    present: Boolean(process.env[s.key]),
  }))
}

export function missingEnv(): EnvItem[] {
  return envItems().filter((e) => !e.present && e.required)
}

// Riepilogo testuale dello stato ambiente (usato nei log server).
export function envSummary(): string {
  const items = envItems()
  const ok = items.filter((i) => i.present).map((i) => i.key)
  const miss = items.filter((i) => !i.present && i.required).map((i) => i.key)
  const opt = items.filter((i) => !i.present && !i.required).map((i) => i.key)
  const lines: string[] = []
  lines.push('Ambiente: ' + ok.length + ' variabili impostate')
  if (miss.length > 0) lines.push('Richieste mancanti: ' + miss.join(', '))
  if (opt.length > 0) lines.push('Opzionali mancanti: ' + opt.join(', '))
  return lines.join(' | ')
}
