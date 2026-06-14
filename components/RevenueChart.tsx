'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { PricePoint } from '@/lib/types'

const tipStyle = {
  background: '#0f0f1f',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
}

const chartMargin = { top: 10, right: 10, left: -10, bottom: 0 }

export default function RevenueChart({ data }: { data: PricePoint[] }) {
  return (
    <ResponsiveContainer width='100%' height={260}>
      <AreaChart data={data} margin={chartMargin}>
        <defs>
          <linearGradient id='rev' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#7c5cff' stopOpacity={0.5} />
            <stop offset='95%' stopColor='#7c5cff' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.06)' />
        <XAxis dataKey='date' stroke='rgba(255,255,255,0.4)' fontSize={12} />
        <YAxis stroke='rgba(255,255,255,0.4)' fontSize={12} />
        <Tooltip contentStyle={tipStyle} />
        <Area type='monotone' dataKey='revenue' stroke='#7c5cff' strokeWidth={2} fill='url(#rev)' />
      </AreaChart>
    </ResponsiveContainer>
  )
}
