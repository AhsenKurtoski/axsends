import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AhsenDS — Launch Kit 2026 | Ahsen Kurtoski',
  description:
    'Launch kit ufficiale di AhsenDS: film 1080p, teaser verticale, otto screenshot reali, poster e press kit. Costruito da Ahsen Kurtoski.',
}

const SHOTS = [
  { file: '01-landing.png', label: '01 · Landing' },
  { file: '02-dashboard.png', label: '02 · Dashboard' },
  { file: '03-autopilot.png', label: '03 · Autopilot' },
  { file: '04-products.png', label: '04 · Catalogo' },
  { file: '05-orders.png', label: '05 · Ordini' },
  { file: '06-analytics.png', label: '06 · Analytics' },
  { file: '07-radar.png', label: '07 · Radar' },
  { file: '08-landing-features.png', label: '08 · Feature' },
]

const SPECS = [
  ['Video master', '1920×1080 · 44s'],
  ['Teaser verticale', '1080×1920 · 18s'],
  ['Codec', 'H.264 / AAC 48 kHz'],
  ['Frame rate', '30 fps'],
  ['Loudness', '−14 LUFS'],
  ['Watermark', 'Ahsen Kurtoski'],
]

export default function LaunchKitPage() {
  return (
    <div className='fixed inset-0 z-[200] overflow-y-auto bg-[#05060d] text-white'>
      <header className='sticky top-0 z-20 border-b border-white/10 bg-[#05060d]/90 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
          <Link href='/' className='flex items-center gap-3'>
            <span className='grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-400 via-brand to-indigo-700 text-lg font-black shadow-lg shadow-brand/30'>
              A
            </span>
            <span>
              <span className='block text-base font-semibold tracking-tight'>AhsenDS</span>
              <span className='block text-[9px] uppercase tracking-[0.2em] text-white/40'>Launch Kit 2026</span>
            </span>
          </Link>
          <div className='flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-white/50'>
            <span className='rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-emerald-300'>● Live product</span>
            <span className='rounded-full border border-white/10 bg-white/5 px-3 py-1.5'>Open source · MIT</span>
            <Link href='/' className='rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10'>
              ← Torna al sito
            </Link>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-5 pb-20'>
        <section className='grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-16'>
          <div>
            <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300'>Launch film · 44 secondi</p>
            <h1 className='mt-4 text-4xl font-semibold leading-[.95] tracking-[-0.045em] sm:text-6xl'>
              Il decollo di{' '}
              <span className='bg-gradient-to-r from-violet-300 via-brand to-cyan-300 bg-clip-text text-transparent'>
                AhsenDS.
              </span>
            </h1>
            <p className='mt-5 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base'>
              Un launch kit completo: film 1080p con musica originale, teaser verticale 9:16, otto schermate reali del prodotto,
              poster, contact sheet e press kit. <strong className='font-medium text-white'>Watermark Ahsen Kurtoski</strong> su ogni asset.
            </p>
            <div className='mt-7 flex flex-wrap gap-2.5'>
              <a href='#film' className='rounded-xl bg-brand px-4 py-2.5 text-xs font-medium transition hover:bg-brand-dark'>▶ Guarda il film</a>
              <a href='/launch/kit/video/ahsends-launch-16x9.mp4' download className='rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10'>
                Scarica MP4
              </a>
              <a href='/launch/kit/ahsends-launch-kit.zip' download className='rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10'>
                Scarica il kit (.zip)
              </a>
            </div>
            <p className='mt-4 text-[10px] uppercase tracking-[0.14em] text-white/30'>1920 × 1080 · 30 fps · H.264 / AAC · −14 LUFS</p>
          </div>

          <div id='film' className='overflow-hidden rounded-2xl border border-white/15 bg-[#0b0d18] shadow-2xl shadow-black/50'>
            <video controls playsInline preload='metadata' poster='/launch/kit/poster.png' className='block aspect-video w-full bg-black'>
              <source src='/launch/kit/video/ahsends-launch-16x9.mp4' type='video/mp4' />
              Il tuo browser non supporta il video HTML5.
            </video>
            <div className='flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-white/40'>
              <span>Launch film · 44s · 1080p</span>
              <a href='/launch/kit/video/ahsends-launch-16x9.mp4' download className='text-violet-300 hover:underline'>Apri / scarica MP4 →</a>
            </div>
          </div>
        </section>

        <section className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
          {[
            ['44s', 'Durata film'],
            ['1080p', 'Risoluzione'],
            ['9:16', 'Teaser social'],
            ['8', 'Screenshot reali'],
          ].map(([value, label]) => (
            <div key={label} className='rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5'>
              <div className='text-2xl font-semibold tracking-tight'>{value}</div>
              <div className='mt-1 text-[8px] uppercase tracking-[0.18em] text-white/35'>{label}</div>
            </div>
          ))}
        </section>

        <section className='mt-12'>
          <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
            <div>
              <h2 className='text-2xl font-semibold tracking-tight'>Il prodotto, live.</h2>
              <p className='mt-1 text-xs text-white/40'>Otto schermate 1920×1080 · UI reale · watermark Ahsen Kurtoski</p>
            </div>
            <a href='/launch/kit/contact-sheet.png' target='_blank' rel='noopener noreferrer' className='text-[10px] uppercase tracking-[0.12em] text-violet-300 hover:underline'>
              Apri contact sheet →
            </a>
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {SHOTS.map((shot) => (
              <a
                key={shot.file}
                href={'/launch/kit/screens/' + shot.file}
                target='_blank'
                rel='noopener noreferrer'
                className='group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-brand/50'
              >
                <img src={'/launch/kit/screens/' + shot.file} alt={shot.label} loading='lazy' className='aspect-video w-full object-cover' />
                <span className='block px-3 py-2.5 text-[9px] uppercase tracking-[0.14em] text-white/45'>{shot.label}</span>
              </a>
            ))}
          </div>
        </section>

        <section className='mt-12 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start'>
          <div className='mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/15 bg-[#0b0d18] shadow-2xl shadow-black/40'>
            <video controls playsInline preload='metadata' poster='/launch/kit/teaser-vertical-poster.png' className='block aspect-[9/16] w-full bg-black'>
              <source src='/launch/kit/video/ahsends-teaser-9x16.mp4' type='video/mp4' />
              Il tuo browser non supporta il video HTML5.
            </video>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300'>Social cut · 9:16</p>
            <h2 className='mt-3 text-2xl font-semibold tracking-tight'>Teaser verticale.</h2>
            <p className='mt-3 max-w-xl text-sm leading-relaxed text-white/55'>
              Diciotto secondi pensati per Reels, TikTok e YouTube Shorts: brand, dashboard, autopilot, catalogo e end card.
              Stessa musica originale del launch film, watermark incluso.
            </p>
            <div className='mt-5 flex flex-wrap gap-2.5'>
              <a href='/launch/kit/video/ahsends-teaser-9x16.mp4' download className='rounded-xl bg-brand px-4 py-2.5 text-xs font-medium transition hover:bg-brand-dark'>Scarica teaser MP4</a>
              <a href='/launch/kit/teaser-vertical-poster.png' target='_blank' rel='noopener noreferrer' className='rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10'>Apri poster verticale</a>
              <a href='/launch/kit/social-copy.md' target='_blank' rel='noopener noreferrer' className='rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10'>Copy social</a>
              <a href='/launch/kit/teaser-publish-kit.md' target='_blank' rel='noopener noreferrer' className='rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10'>Kit pubblicazione</a>
            </div>
          </div>
        </section>

        <section className='mt-12 grid gap-4 lg:grid-cols-[1.2fr_.8fr]'>
          <a href='/launch/kit/poster.png' target='_blank' rel='noopener noreferrer' className='block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]'>
            <img src='/launch/kit/poster.png' alt='Poster AhsenDS' className='w-full' />
          </a>
          <div className='rounded-2xl border border-white/10 bg-white/[0.035] p-6'>
            <h2 className='text-base font-semibold'>Specifiche tecniche</h2>
            <div className='mt-4 space-y-0'>
              {SPECS.map(([label, value]) => (
                <div key={label} className='flex items-center justify-between gap-3 border-t border-white/[0.07] py-2.5 text-[10px] first:border-t-0'>
                  <span className='text-white/35'>{label}</span>
                  <span className='font-medium text-white/80'>{value}</span>
                </div>
              ))}
            </div>
            <p className='mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.055] p-3 text-[10px] leading-relaxed text-amber-100/70'>
              Le schermate usano prodotti e ordini demo per mostrare la UI popolata. Il prodotto e i flussi mostrati sono reali;
              i dati E2E restano nel database per i test end-to-end.
            </p>
          </div>
        </section>

        <section className='mt-12'>
          <div className='mb-5'>
            <h2 className='text-2xl font-semibold tracking-tight'>Scarica tutto.</h2>
            <p className='mt-1 text-xs text-white/40'>File pronti per presentazioni, social e press kit.</p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              ['Launch film', 'MP4 · 16:9 · 44s', '/launch/kit/video/ahsends-launch-16x9.mp4'],
              ['Teaser', 'MP4 · 9:16 · 18s', '/launch/kit/video/ahsends-teaser-9x16.mp4'],
              ['Press kit ZIP', 'Video, teaser e press kit', '/launch/kit/ahsends-launch-kit.zip'],
              ['Copy social', 'Hook, caption, hashtag', '/launch/kit/social-copy.md'],
            ].map(([title, sub, href]) => (
              <a
                key={title}
                href={href}
                download={title !== 'Copy social' ? true : undefined}
                target={title === 'Copy social' ? '_blank' : undefined}
                rel={title === 'Copy social' ? 'noopener noreferrer' : undefined}
                className='group rounded-xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-brand/40 hover:bg-white/[0.06]'
              >
                <div className='text-sm font-medium'>{title}</div>
                <div className='mt-1 text-[10px] text-white/35'>{sub}</div>
                <div className='mt-4 text-[10px] uppercase tracking-[0.14em] text-violet-300'>Scarica →</div>
              </a>
            ))}
          </div>
        </section>

        <section className='mt-12 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <h2 className='text-lg font-semibold'>Il prodotto dietro il film.</h2>
              <p className='mt-1 max-w-2xl text-xs leading-relaxed text-white/45'>
                AhsenDS è open source, self-hosted e senza abbonamenti. Usa API reali: se una chiave manca, lo dice invece di inventare contenuti.
                Nessuna garanzia di guadagno: il software automatizza il lavoro, non i risultati.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Link href='/' className='rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10'>Apri il sito</Link>
              <a href='https://github.com/AhsenKurtoski/axsends' target='_blank' rel='noopener noreferrer' className='rounded-xl bg-brand px-4 py-2.5 text-xs font-medium transition hover:bg-brand-dark'>GitHub →</a>
            </div>
          </div>
        </section>
      </main>

      <footer className='border-t border-white/10 px-5 py-6'>
        <div className='mx-auto flex max-w-6xl flex-col justify-between gap-2 text-[10px] text-white/35 sm:flex-row'>
          <span>Progettato, sviluppato e raccontato da <strong className='font-medium text-white/70'>Ahsen Kurtoski</strong>.</span>
          <span>AhsenDS · Launch Kit 2026 · <strong className='font-medium text-white/70'>Open source, MIT</strong></span>
        </div>
      </footer>
    </div>
  )
}
