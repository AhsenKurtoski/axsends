// Pubblicazione su una Pagina Facebook tramite Graph API (Pages API).
// Doc: https://developers.facebook.com/docs/pages-api/posts
// Richiede una Pagina Facebook, FB_PAGE_ID e un Page Access Token long-lived
// (FACEBOOK_PAGE_ACCESS_TOKEN).

const GRAPH = 'https://graph.facebook.com/v21.0'
const GRAPH_VIDEO = 'https://graph-video.facebook.com/v21.0'

export async function publishToFacebook(opts: {
  videoUrl?: string
  imageUrl?: string
  message?: string
  link?: string
}): Promise<{ ok: boolean; status: string; data?: any; error?: string }> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FB_PAGE_ID
  if (!token || !pageId) return { ok: false, status: 'no-token', error: 'FACEBOOK_PAGE_ACCESS_TOKEN o FB_PAGE_ID mancante' }

  const message = opts.message || ''
  try {
    let endpoint = ''
    const params = new URLSearchParams()
    params.set('access_token', token)

    if (opts.videoUrl) {
      // i video vanno sull host graph-video
      endpoint = GRAPH_VIDEO + '/' + pageId + '/videos'
      params.set('file_url', opts.videoUrl)
      if (message) params.set('description', message)
    } else if (opts.imageUrl) {
      endpoint = GRAPH + '/' + pageId + '/photos'
      params.set('url', opts.imageUrl)
      if (message) params.set('caption', message)
    } else {
      endpoint = GRAPH + '/' + pageId + '/feed'
      params.set('message', message)
      if (opts.link) params.set('link', opts.link)
    }

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const j: any = await r.json().catch(() => null)
    if (!r.ok || !j || (!j.id && !j.post_id)) {
      const msg = (j && j.error && j.error.message) || 'HTTP ' + r.status
      return { ok: false, status: 'error', error: msg, data: j }
    }
    return { ok: true, status: 'published', data: j }
  } catch (e) {
    return { ok: false, status: 'error', error: String(e) }
  }
}
