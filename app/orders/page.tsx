import StatusBadge from '@/components/StatusBadge'
import { orders } from '@/lib/mockData'

export default function OrdersPage() {
  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-semibold'>Ordini</h1>
        <p className='text-sm text-white/50'>Gestione e fulfillment degli ordini</p>
      </header>
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
    </div>
  )
}
