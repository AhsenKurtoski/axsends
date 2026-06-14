// Upload di un video su YouTube tramite Data API v3 (resumable upload).
// Doc: https://developers.google.com/youtube/v3/docs/videos/insert
// Richiede OAuth 2.0 con scope youtube.upload e un progetto Google Cloud con la API attiva.

export async function uploadVideo(opts: {
  videoUrl: string
  title?: string
  description?: string
  tags?: string[]
  privacy?: 'private' | 'unlisted' | 'public'
}): Promise<{ ok: boolean; status: string; data?: any; error?: string }> {
  const token = process.env.YOUTUBE_ACCESS_TOKEN
  if (!token) return { ok: false, status: 'no-token', error: 'YOUTUBE_ACCESS_TOKEN mancante' }
  if (!opts.videoUrl) return { ok: false, status: 'no-url', error: 'URL del video mancante' }

  try {
    // 1. scarica i byte del video dall'URL pubblico
    const vid = await fetch(opts.videoUrl)
    if (!vid.ok) {
      return { ok: false, status: 'error', error: 'Impossibile scaricare il video (HTTP ' + vid.status + ')' }
    }
    const contentType = vid.headers.get('content-type') || 'video/mp4'
    const buf = Buffer.from(await vid.arrayBuffer())

    // 2. inizializza la sessione resumable
    const init = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': contentType,
          'X-Upload-Content-Length': String(buf.length),
        },
        body: JSON.stringify({
          snippet: {
            title: opts.title || 'Nuovo video',
            description: opts.description || '',
            tags: opts.tags || [],
          },
          status: { privacyStatus: opts.privacy || 'private' },
        }),
      }
    )
    if (!init.ok) {
      const detail = await init.text()
      return {
        ok: false,
        status: 'error',
        error: 'Inizializzazione upload fallita (HTTP ' + init.status + ')',
        data: detail.slice(0, 300),
      }
    }
    const location = init.headers.get('location')
    if (!location) return { ok: false, status: 'error', error: 'Sessione di upload non ricevuta da YouTube' }

    // 3. carica i byte del video sulla sessione
    const up = await fetch(location, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: buf,
    })
    const json: any = await up.json().catch(() => null)
    if (!up.ok) {
      const msg = (json && json.error && json.error.message) || 'Upload fallito (HTTP ' + up.status + ')'
      return { ok: false, status: 'error', error: msg, data: json }
    }
    return { ok: true, status: 'uploaded', data: json }
  } catch (e) {
    return { ok: false, status: 'error', error: String(e) }
  }
}
