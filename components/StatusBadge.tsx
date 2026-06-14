const map: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  paused: 'bg-amber-500/15 text-amber-400',
  out_of_stock: 'bg-rose-500/15 text-rose-400',
  pending: 'bg-amber-500/15 text-amber-400',
  processing: 'bg-sky-500/15 text-sky-400',
  shipped: 'bg-indigo-500/15 text-indigo-400',
  delivered: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-rose-500/15 text-rose-400',
}

const labels: Record<string, string> = {
  active: 'Attivo',
  paused: 'In pausa',
  out_of_stock: 'Esaurito',
  pending: 'In attesa',
  processing: 'In lavorazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

export default function StatusBadge({ status }: { status: string }) {
  const cls = map[status] || 'bg-white/10 text-white/60'
  return (
    <span className={'rounded-full px-2.5 py-1 text-xs ' + cls}>
      {labels[status] || status}
    </span>
  )
}
