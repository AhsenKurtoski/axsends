'use client'

import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

// Cattura gli errori di rendering dei componenti figli invece di far
// comparire la schermata bianca di Next.js. Mostra un messaggio chiaro
// con la possibilita' di ricaricare la pagina.
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown) {
    // Visibile nella console del browser e nei log server (se remoto)
    console.error('ErrorBoundary:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className='glass mx-auto max-w-lg p-6 text-center'>
        <div className='mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-500/15 text-red-400'>
          !
        </div>
        <h2 className='text-lg font-medium'>Si e' verificato un errore</h2>
        <p className='mt-2 text-sm text-white/50'>
          La pagina non e' stata caricata correttamente. Puoi riprovare: se il problema persiste,
          controlla la console del browser.
        </p>
        <button
          onClick={() => window.location.reload()}
          className='mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark'
        >
          Ricarica la pagina
        </button>
      </div>
    )
  }
}
