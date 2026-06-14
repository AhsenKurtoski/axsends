import { NextResponse } from 'next/server'
import { publishVideo } from '@/lib/tiktok'
import { uploadVideo } from '@/lib/youtube'
import { publishMedia } from '@/lib/instagram'
import { publishToFacebook } from '@/lib/facebook'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Pubblica lo stesso video su Facebook, Instagram, TikTok e YouTube (quelle configurate).
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const videoUrl = b && b.videoUrl
  const caption = (b && b.caption) || ''
  const title = (b && b.title) || caption.slice(0, 90) || 'Nuovo video'
  const description = (b && b.description) || caption
  const tags = Array.isArray(b && b.tags) ? b.tags : []

  if (!videoUrl) {
    return NextResponse.json({ ok: false, error: 'URL del video mancante (serve un link pubblico al file .mp4).' })
  }

  const results: any = {}

  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FB_PAGE_ID) {
    results.facebook = await publishToFacebook({ videoUrl, message: caption })
  } else {
    results.facebook = { ok: false, status: 'no-token', error: 'FACEBOOK_PAGE_ACCESS_TOKEN o FB_PAGE_ID mancante' }
  }

  if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.IG_USER_ID) {
    results.instagram = await publishMedia({ videoUrl, caption })
  } else {
    results.instagram = { ok: false, status: 'no-token', error: 'INSTAGRAM_ACCESS_TOKEN o IG_USER_ID mancante' }
  }

  if (process.env.TIKTOK_ACCESS_TOKEN) {
    results.tiktok = await publishVideo({ videoUrl, caption })
  } else {
    results.tiktok = { ok: false, status: 'no-token', error: 'TIKTOK_ACCESS_TOKEN mancante' }
  }

  if (process.env.YOUTUBE_ACCESS_TOKEN) {
    results.youtube = await uploadVideo({ videoUrl, title, description, tags })
  } else {
    results.youtube = { ok: false, status: 'no-token', error: 'YOUTUBE_ACCESS_TOKEN mancante' }
  }

  const publishedOn = Object.keys(results).filter((k) => results[k] && results[k].ok)
  return NextResponse.json({
    ok: publishedOn.length > 0,
    publishedOn,
    results,
    note:
      publishedOn.length > 0
        ? 'Pubblicato su: ' + publishedOn.join(', ') + '.'
        : 'Nessuna piattaforma configurata o pubblicazione non riuscita. Controlla i token e l URL pubblico del video.',
  })
}
