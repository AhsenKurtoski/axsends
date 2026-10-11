import { NextResponse, NextRequest } from 'next/server'
import { publishVideo } from '@/lib/tiktok'
import { validateBody, tiktokBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.social(req)
  if (rateLimitResponse) return rateLimitResponse
  const validation = await validateBody(req, tiktokBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { videoUrl, caption } = validation.data

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
