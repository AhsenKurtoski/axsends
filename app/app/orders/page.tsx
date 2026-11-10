'use client'

import { useEffect, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import type { Order } from '@/lib/types'
import { ShoppingCart } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((res) => {
        setOrders((res && res.data) || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Ordini</h1>
        <p className='text-sm text-white/50'>Gestione e fulfillment degli ordini</p>
      </header>

      {loading ? (
        <div className='glass grid min-h-[200px] place-items-center p-8 text-sm text-white/40'>Caricamento...</div>
      ) : orders.length === 0 ? (
        <div className='glass grid min-h-[260px] place-items-center p-8 text-center'>
          <div className='max-w-md space-y-3'>
            <div className='mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand'>
              <ShoppingCart size={26} />
            </div>
            <h2 className='text-lg font-medium'>Nessun ordine</h2>
            <p className='text-sm text-white/50'>Gli ordini reali appariranno qui non appena collegherai Supabase e inizierai a vendere.</p>
          </div>
        </div>
      ) : (
        <div className='glass p-5'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-white/40'>
                  <th className='pb-3 font-normal'>Ordine</th>
                  <th className='pb-3 font-normal'>Prodotto</th>
                  <th className='pb-3 font-normal'>Cliente</th>
                  <th className='pb-3 font-normal'>Data</th>
                  <th className='pb-3 font-normal'>Totale</th>
                  <th className='pb-3 font-normal'>Stato</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className='border-t border-white/5'>
                    <td className='py-3 text-white/70'>{o.id}</td>
                    <td className='py-3'>{o.product}</td>
                    <td className='py-3 text-white/70'>{o.customer}</td>
                    <td className='py-3 text-white/50'>{o.date}</td>
                    <td className='py-3'>€{o.total}</td>
                    <td className='py-3'><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
