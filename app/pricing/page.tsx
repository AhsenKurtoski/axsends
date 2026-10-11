'use client'

import { useEffect, useState } from 'react'
import { Tag, Save, Check } from 'lucide-react'

const SAMPLE = [5, 10, 15, 25, 40, 60]

export default function PricingPage() {
  const [markup, setMarkup] = useState(1.25)
  const [round99, setRound99] = useState(true)
  const [minMargin, setMinMargin] = useState(20)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ahsends_pricing') || localStorage.getItem('axsends_pricing')
      if (raw) {
        const r = JSON.parse(raw)
        if (typeof r.markup === 'number') setMarkup(r.markup)
        if (typeof r.round99 === 'boolean') setRound99(r.round99)
        if (typeof r.minMargin === 'number') setMinMargin(r.minMargin)
      }
    } catch (err) {
      // nessuna regola salvata
    }
  }, [])

  function priceFor(cost: number) {
    let price = cost * markup
    if (round99) price = Math.max(Math.floor(price), 1) + 0.99
    let margin = ((price - cost) / price) * 100
    if (margin < minMargin) {
      price = cost / (1 - minMargin / 100)
      if (round99) price = Math.max(Math.floor(price), 1) + 0.99
      margin = ((price - cost) / price) * 100
    }
    return { price: Math.round(price * 100) / 100, margin: Math.round(margin) }
  }

  function save() {
    try {
      localStorage.setItem('ahsends_pricing', JSON.stringify({ markup, round99, minMargin }))
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      // localStorage non disponibile
    }
  }

  return (
    <div className='space-y-6'>
      <header className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold'>
            <Tag className='text-brand' size={22} /> Regole di prezzo automatiche AhsenDS
          </h1>
          <p className='text-sm text-white/50'>Margine calibrato &bull; Costruito da Ahsen Kurtoski</p>
        </div>
        <div className='inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-1.5 text-xs text-brand-light self-start sm:self-auto'>
          <span>Costruito da <strong className='text-white'>Ahsen Kurtoski</strong></span>
        </div>
      </header>

      <div className='grid gap-6 lg:grid-cols-3'>
        <div className='glass space-y-5 p-5 lg:col-span-1'>
          <label className='block'>
            <span className='text-xs text-white/50'>Markup (moltiplicatore sul costo)</span>
            <input
              type='number'
              step={0.05}
              min={1}
              value={markup}
              onChange={(e) => setMarkup(Number(e.target.value) || 1)}
              className='mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand'
            />
          </label>
          <label className='block'>
            <span className='text-xs text-white/50'>Margine minimo (%)</span>
            <input
              type='number'
              step={1}
              min={0}
              max={95}
              value={minMargin}
              onChange={(e) => setMinMargin(Number(e.target.value) || 0)}
              className='mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand'
            />
          </label>
          <label className='flex items-center gap-2'>
            <input type='checkbox' checked={round99} onChange={(e) => setRound99(e.target.checked)} />
            <span className='text-sm'>Arrotonda a .99</span>
          </label>
          <button
            onClick={save}
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark'
          >
            {saved ? (
              <>
                <Check size={16} /> Salvato
              </>
            ) : (
              <>
                <Save size={16} /> Salva regole
              </>
            )}
          </button>
          <p className='text-xs text-white/30'>Suggerimento: con margine basso (+15-30%) i tuoi prezzi battono i concorrenti e converti di piu. Il profitto arriva dal volume.</p>
        </div>

        <div className='glass p-5 lg:col-span-2'>
          <div className='mb-3 text-sm font-medium'>Anteprima prezzi</div>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-xs text-white/40'>
                <th className='pb-2'>Costo</th>
                <th className='pb-2'>Prezzo vendita</th>
                <th className='pb-2'>Margine</th>
                <th className='pb-2'>Profitto</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-white/5'>
              {SAMPLE.map((cost) => {
                const r = priceFor(cost)
                const profit = Math.round((r.price - cost) * 100) / 100
                return (
                  <tr key={cost}>
                    <td className='py-2 text-white/60'>€{cost}</td>
                    <td className='py-2 font-semibold'>€{r.price}</td>
                    <td className='py-2 text-emerald-400'>{r.margin}%</td>
                    <td className='py-2 text-white/80'>€{profit}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
