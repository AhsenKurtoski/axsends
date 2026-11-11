import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className='grid min-h-[70vh] place-items-center px-4'>
      <div className='glass w-full max-w-md p-8 text-center'>
        <p className='text-xs font-medium uppercase tracking-[0.2em] text-brand'>404</p>
        <h1 className='mt-2 text-2xl font-semibold'>Pagina non trovata</h1>
        <p className='mt-2 text-sm text-white/50'>Il link non esiste o è stato spostato.</p>
        <Link
          href='/'
          className='mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'
        >
          <ArrowLeft size={15} /> Torna al sito
        </Link>
      </div>
    </div>
  )
}
