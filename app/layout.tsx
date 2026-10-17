import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'AhsenDS — Dropshipping Automation | Costruito da Ahsen Kurtoski',
  description: 'Piattaforma avanzata di automazione dropshipping, AI copy, video ads e web studio costruita da Ahsen Kurtoski.',
  authors: [{ name: 'Ahsen Kurtoski' }],
  creator: 'Ahsen Kurtoski',
  publisher: 'Ahsen Kurtoski',
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
                <div className='font-medium text-white/70'>
                  Costruito con cura e dedizione da <span className='text-brand font-semibold'>Ahsen Kurtoski</span>
                </div>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
