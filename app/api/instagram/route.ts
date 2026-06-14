import { NextResponse } from 'next/server'
import { publishMedia } from '@/lib/instagram'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any

  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.IG_USER_ID) {
    return NextResponse.json({
      ok: false,
      configured: false,
      note:
        'Per pubblicare su Instagram servono INSTAGRAM_ACCESS_TOKEN e IG_USER_ID (account Business/Creator). Vedi README.',
    })
  }

  const r = await publishMedia({
    imageUrl: body && body.imageUrl,
    videoUrl: body && body.videoUrl,
    caption: body && body.caption,
  })
  return NextResponse.json({ configured: true, ...r })
}
