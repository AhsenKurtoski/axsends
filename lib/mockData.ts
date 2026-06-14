import type { Product, Order, Supplier, PricePoint } from '@/lib/types'

// Nessun dato demo: l'app mostra dati reali (CJ / Supabase) oppure uno stato vuoto con onboarding.
export const products: Product[] = []
export const orders: Order[] = []
export const suppliers: Supplier[] = []
export const revenueSeries: PricePoint[] = []
export const stats = { revenue: 0, orders: 0, activeProducts: 0, avgMargin: 0 }
