// Pubblicazione video su TikTok tramite Content Posting API (Direct Post).
// Endpoint ufficiale: https://open.tiktokapis.com/v2/post/publish/video/init/
// Richiede un'app approvata (scope video.publish) e un access token utente.

const BASE = 'https://open.tiktokapis.com/v2'

export async function publishVideo(opts: {
  videoUrl: string
  caption?: string
}): Promise<{ ok: boolean; status: string; data?: any; error?: string }> {
  const token = process.env.TIKTOK_ACCESS_TOKEN
  if (!token) return { ok: false, status: 'no-token', error: 'TIKTOK_ACCESS_TOKEN mancante' }
  if (!opts.videoUrl) return { ok: false, status: 'no-url', error: 'URL del video mancante' }

  try {
    const res = await fetch(BASE + '/post/publish/video/init/', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: opts.caption || '',
          // SELF_ONLY = privato: ideale per uso personale e per app non ancora auditate
          privacy_level: 'SELF_ONLY',
          disable_comment: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: opts.videoUrl,
        },
      }),
    })
    const json: any = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = (json && json.error && json.error.message) || 'HTTP ' + res.status
      return { ok: false, status: 'error', error: msg, data: json }
    }
    return { ok: true, status: 'published', data: json }
  } catch (e) {
    return { ok: false, status: 'error', error: String(e) }
  }
}
