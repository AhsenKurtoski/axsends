// Pubblicazione su Instagram tramite Graph API (Content Publishing).
// Doc: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
// Richiede un account Instagram Business/Creator collegato a una Pagina Facebook,
// IG_USER_ID e un access token long-lived (INSTAGRAM_ACCESS_TOKEN).

const GRAPH = 'https://graph.facebook.com/v21.0'

export async function publishMedia(opts: {
  imageUrl?: string
  videoUrl?: string
  caption?: string
}): Promise<{ ok: boolean; status: string; data?: any; error?: string }> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const igUser = process.env.IG_USER_ID
  if (!token || !igUser) return { ok: false, status: 'no-token', error: 'INSTAGRAM_ACCESS_TOKEN o IG_USER_ID mancante' }
  if (!opts.imageUrl && !opts.videoUrl) return { ok: false, status: 'no-media', error: 'Serve imageUrl o videoUrl' }

  try {
    // 1. crea il container del media
    const createParams = new URLSearchParams()
    createParams.set('access_token', token)
    if (opts.caption) createParams.set('caption', opts.caption)
    if (opts.videoUrl) {
      createParams.set('media_type', 'REELS')
      createParams.set('video_url', opts.videoUrl)
    } else if (opts.imageUrl) {
      createParams.set('image_url', opts.imageUrl)
    }
    const create = await fetch(GRAPH + '/' + igUser + '/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createParams.toString(),
    })
    const created: any = await create.json().catch(() => null)
    if (!create.ok || !created || !created.id) {
      const msg = (created && created.error && created.error.message) || 'HTTP ' + create.status
      return { ok: false, status: 'error', error: msg, data: created }
    }
    const creationId = created.id

    // 2. per i video Instagram deve processare il file: aspetta che sia pronto
    if (opts.videoUrl) {
      let ready = false
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 4000))
        const st = await fetch(GRAPH + '/' + creationId + '?fields=status_code&access_token=' + token)
        const sj: any = await st.json().catch(() => null)
        if (sj && sj.status_code === 'FINISHED') {
          ready = true
          break
        }
        if (sj && sj.status_code === 'ERROR') {
          return { ok: false, status: 'error', error: 'Instagram non e riuscito a processare il video', data: sj }
        }
      }
      if (!ready) {
        return { ok: false, status: 'processing', error: 'Video ancora in elaborazione su Instagram, riprova tra poco' }
      }
    }

    // 3. pubblica il container
    const pubParams = new URLSearchParams()
    pubParams.set('access_token', token)
    pubParams.set('creation_id', creationId)
    const pub = await fetch(GRAPH + '/' + igUser + '/media_publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: pubParams.toString(),
    })
    const published: any = await pub.json().catch(() => null)
    if (!pub.ok || !published || !published.id) {
      const msg = (published && published.error && published.error.message) || 'HTTP ' + pub.status
      return { ok: false, status: 'error', error: msg, data: published }
    }
    return { ok: true, status: 'published', data: published }
  } catch (e) {
    return { ok: false, status: 'error', error: String(e) }
  }
}
