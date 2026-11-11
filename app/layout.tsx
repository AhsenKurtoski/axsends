import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  metadataBase: new URL('https://axsends.vercel.app'),
  title: 'AhsenDS — Dropshipping Automation | Costruito da Ahsen Kurtoski',
  description: 'Piattaforma avanzata di automazione dropshipping, AI copy, video ads e web studio costruita da Ahsen Kurtoski.',
  authors: [{ name: 'Ahsen Kurtoski' }],
  creator: 'Ahsen Kurtoski',
  publisher: 'Ahsen Kurtoski',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    siteName: 'AhsenDS',
    title: 'AhsenDS — Dropshipping Automation',
    description: 'Prodotti reali, AI, ads, landing e automazioni in un’unica piattaforma self-hosted.',
    images: [
      {
        url: '/launch/kit/screens/01-landing.png',
        width: 1920,
        height: 1080,
        alt: 'AhsenDS — dashboard e landing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AhsenDS — Dropshipping Automation',
    description: 'Prodotti reali, AI, ads, landing e automazioni in un’unica piattaforma self-hosted.',
    images: ['/launch/kit/screens/01-landing.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='it'>
      <body>
        <ErrorBoundary>
          <div className='flex min-h-screen flex-col md:flex-row'>
            <Sidebar />
            <div className='flex-1 flex flex-col min-w-0'>
              <main className='flex-1 p-4 sm:p-6 md:p-10 overflow-x-hidden'>{children}</main>
              <footer className='mx-4 sm:mx-6 md:mx-10 mb-6 border-t border-white/5 pt-5 pb-2 text-xs text-white/50 flex flex-col sm:flex-row items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <span className='h-2 w-2 rounded-full bg-emerald-400 animate-pulse' />
                  <span>AhsenDS &bull; Piattaforma E-commerce &amp; Dropshipping</span>
                </div>
                <div className='flex flex-col items-center gap-1 text-center sm:items-end sm:text-right'>
                  <div className='font-medium text-white/70'>
                    Costruito con cura e dedizione da <span className='text-brand font-semibold'>Ahsen Kurtoski</span>
                  </div>
                  <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]'>
                    <a href='mailto:ahsenkurtoski@financier.com' className='transition hover:text-white'>
                      ahsenkurtoski@financier.com
                    </a>
                    <a
                      href='https://wa.me/393312053485?text=Ciao%20Ahsen%2C%20vorrei%20parlare%20di%20una%20collaborazione%20con%20AhsenDS.'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='transition hover:text-white'
                    >
                      WhatsApp +39 331 205 3485
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
