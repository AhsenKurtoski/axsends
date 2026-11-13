import { NextResponse, NextRequest } from 'next/server'
import { validateBody, generateVideoBodySchema } from '@/lib/validations'
import { rateLimitConfigs } from '@/lib/rateLimit'
import { generateImage, imageFailureReason } from '@/lib/hf'
import { animateImage, videoConfigured, videoModelLabel } from '@/lib/video'
import { buildSubtitles, motionPrompt, normalizeScenes } from '@/lib/adkit'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

// Studio video: fotogramma AI verticale -> animazione con Wan 2.2 su Hugging
// Face ZeroGPU (gratis, senza carta) -> MP4 + sottotitoli SRT/VTT pronti.
// Se lo Space e' in coda o la quota GPU e' finita, tornano i fotogrammi.

export async function POST(req: NextRequest) {
  // Rate limiting per API AI
  const rateLimitResponse = await rateLimitConfigs.ai(req)
  if (rateLimitResponse) return rateLimitResponse

  const validation = await validateBody(req, generateVideoBodySchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { prompt, product, scenes, image } = validation.data
  const base = prompt.trim() || 'cinematic product advertisement, vibrant colors, 4k'

  // Normalizza lo storyboard una volta sola: serve per frame, motion e sottotitoli.
  const storyboard = scenes && scenes.length > 0 ? normalizeScenes(scenes) : []
  const shots = storyboard.length > 0 ? storyboard : [{ time: '0-3s', visual: base, voiceover: '', text: '' }]
  const subtitles = buildSubtitles(storyboard)

  const framePrompt = (shot: { visual: string }) =>
    'Cinematic vertical advertising frame, ' + (shot.visual || base) + (product ? ', product: ' + product : '') +
    ', studio lighting, vibrant colors, ultra detailed, e-commerce hero shot, no text'

  // 1) fotogramma hero: copertina e input del video
  // Se il client passa gia l'immagine dell'ad (o la foto prodotto) la usiamo
  // cosi com'e: il video costa una sola chiamata GPU e la quota immagini resta.
  const provided =
    image && /^(data:image\/[a-z+.-]+;base64,|https?:\/\/)/i.test(image) ? image : null

  const firstFrame = provided || (await generateImage(framePrompt(shots[0]), { width: 768, height: 1344 }))
  if (!firstFrame) {
    return NextResponse.json(
      {
        error:
          'Generatore immagini non disponibile: ' +
          (imageFailureReason() || 'nessuna risposta dal servizio') +
          '. Il piano gratuito concede 1 immagine ogni 45 secondi: attesa ultimata, riprova tra un minuto o imposta POLLINATIONS_TOKEN.',
      },
      { status: 502 }
    )
  }

  const frames: string[] = [firstFrame]

  // 2) animazione gratuita con prompt da studio (ottica, luce, camera, grading)
  if (videoConfigured()) {
    const motion = motionPrompt(product || 'prodotto', shots[0])
    const animated = await animateImage(firstFrame, motion, { durationSeconds: 3, timeoutMs: 150_000 })
    if (animated.ok) {
      return NextResponse.json({
        video: animated.video,
        videoModel: videoModelLabel(),
        frames,
        provider: 'huggingface-zerogpu',
        subtitleCues: subtitles.cues,
        subtitles,
        note:
          'Video AI generato gratis con ' + videoModelLabel() +
          '. Scarica l MP4 e i sottotitoli SRT: importali in CapCut/Premiere (1 clic) per averli bruciati nel video.',
      })
    }

    // Video non disponibile: restituisco comunque i fotogrammi e spiego il motivo.
    return NextResponse.json({
      video: null,
      videoModel: videoModelLabel(),
      videoError: animated.error,
      frames,
      provider: 'pollinations-frames',
      subtitleCues: subtitles.cues,
      subtitles,
      note:
        'Video AI non disponibile ora (' + animated.error + '). Ho generato ' + frames.length +
        ' fotogrammi AI e i sottotitoli SRT: montali in CapCut (gratis) con lo script e il voiceover.',
    })
  }

  // Video disattivato: solo fotogrammi.
  return NextResponse.json({
    video: null,
    frames,
    provider: 'pollinations-frames',
    subtitleCues: subtitles.cues,
    subtitles,
    note:
      'Generati ' + frames.length + ' fotogrammi AI e i sottotitoli SRT. La generazione video e disattivata (HF_VIDEO_SPACE=off).',
  })
}
