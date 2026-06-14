import { NextResponse } from 'next/server'
import { uploadVideo } from '@/lib/youtube'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any

  if (!process.env.YOUTUBE_ACCESS_TOKEN) {
    return NextResponse.json({
      ok: false,
      configured: false,
      note:
        'Per pubblicare su YouTube serve un YOUTUBE_ACCESS_TOKEN (OAuth scope youtube.upload). Vedi README.',
    })
  }

  const r = await uploadVideo({
    videoUrl: body && body.videoUrl,
    title: body && body.title,
    description: body && body.description,
    tags: body && body.tags,
  })
  return NextResponse.json({ configured: true, ...r })
}
