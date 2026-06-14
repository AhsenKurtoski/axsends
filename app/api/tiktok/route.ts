import { NextResponse } from 'next/server'
import { publishVideo } from '@/lib/tiktok'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any
  const videoUrl = body && body.videoUrl
  const caption = body && body.caption

  if (!process.env.TIKTOK_ACCESS_TOKEN) {
    return NextResponse.json({
      ok: false,
      configured: false,
      note:
        'Per pubblicare su TikTok serve un TIKTOK_ACCESS_TOKEN da un app approvata (scope video.publish). Vedi README.',
    })
  }

  const r = await publishVideo({ videoUrl, caption })
  return NextResponse.json({ configured: true, ...r })
}
