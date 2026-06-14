import type { LucideIcon } from 'lucide-react'

export default function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string
  value: string
  delta?: string
  icon: LucideIcon
}) {
  const positive = delta?.startsWith('+')
  return (
    <div className='glass glass-hover p-5'>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-white/50'>{label}</span>
        <span className='grid h-9 w-9 place-items-center rounded-xl bg-brand/15 text-brand'>
          <Icon size={18} />
        </span>
      </div>
      <div className='mt-3 text-2xl font-semibold'>{value}</div>
      {delta ? (
        <div className={positive ? 'mt-1 text-xs text-emerald-400' : 'mt-1 text-xs text-rose-400'}>
          {delta} vs mese scorso
        </div>
      ) : null}
    </div>
  )
}
