import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Genera contenuti promozionali per un link affiliato (caption, hashtag, disclosure).
// Deterministico: funziona sempre, senza chiavi esterne.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any
  const product = (body && body.product) || 'questo prodotto'
  const link = (body && body.link) || ''
  const platform = (body && body.platform) || 'TikTok'
  const network = (body && body.network) || 'Amazon'

  const slug = String(product).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const hashtags = ['#' + slug, '#affiliate', '#dealoftheday', '#musthave', '#sconto']
  const captions = [
    'Ho provato ' + product + ' ed e una bomba. Link in descrizione!',
    'Stop allo scroll: ' + product + ' che ti semplifica la vita.',
    'Perche tutti parlano di ' + product + '? Te lo spiego in 30 secondi.',
  ]

  return NextResponse.json({
    title: product + ' - vale la pena? (link sotto)',
    body: 'Ti spiego perche ' + product + ' merita. Lo trovi qui: ' + link,
    captions,
    hashtags,
    disclosure:
      'Disclosure: questo contenuto include link affiliati ' +
      network +
      '. Acquistando tramite il link posso ricevere una commissione, senza costi extra per te.',
    cta: 'Tocca il link per approfittare dell offerta su ' + network + '.',
    platform,
  })
}
