import { NextResponse } from 'next/server'
import { publishToFacebook } from '@/lib/facebook'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Pubblica un post o un video sulla tua Pagina Facebook.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as any
  const videoUrl = b && b.videoUrl
  const imageUrl = b && b.imageUrl
  const message = (b && (b.message || b.caption)) || ''
  const link = b && b.link

  if (!process.env.FACEBOOK_PAGE_ACCESS_TOKEN || !process.env.FB_PAGE_ID) {
    return NextResponse.json({
      configured: false,
      ok: false,
      note: 'Aggiungi FB_PAGE_ID e FACEBOOK_PAGE_ACCESS_TOKEN in .env.local per pubblicare su Facebook.',
    })
  }

  const res = await publishToFacebook({ videoUrl, imageUrl, message, link })
  return NextResponse.json(Object.assign({ configured: true }, res))
}
