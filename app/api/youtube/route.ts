import { NextResponse, NextRequest } from 'next/server'
import { uploadVideo } from '@/lib/youtube'
import { validateBody, youtubeBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimitConfigs.social(req)
  if (rateLimitResponse) return rateLimitResponse
  const validation = await validateBody(req, youtubeBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { videoUrl, title, description, tags, privacy } = validation.data

  if (!process.env.YOUTUBE_ACCESS_TOKEN) {
    return NextResponse.json({
      ok: false,
      configured: false,
      note:
        'Per pubblicare su YouTube serve un YOUTUBE_ACCESS_TOKEN (OAuth scope youtube.upload). Vedi README.',
    })
  }

  const r = await uploadVideo({
    videoUrl,
    title,
    description,
    tags,
    privacy,
  })
  return NextResponse.json({ configured: true, ...r })
}
