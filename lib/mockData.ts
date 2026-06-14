import type { Product, Order, Supplier, PricePoint } from '@/lib/types'

export const products: Product[] = [
  { id: 'p1', name: 'Mini proiettore portatile HD', image: '🎥', supplier: 'CJ Dropshipping', cost: 18.4, price: 49.9, stock: 132, sold: 412, status: 'active' },
  { id: 'p2', name: 'Cuffie wireless ANC', image: '🎧', supplier: 'EU Local Warehouse', cost: 12.1, price: 39.9, stock: 64, sold: 286, status: 'active' },
  { id: 'p3', name: 'Smartwatch fitness', image: '⌚', supplier: 'AliExpress Choice', cost: 9.8, price: 34.9, stock: 21, sold: 530, status: 'active' },
  { id: 'p4', name: 'Lampada LED da scrivania', image: '💡', supplier: 'Temu Supply', cost: 6.5, price: 24.9, stock: 0, sold: 198, status: 'out_of_stock' },
  { id: 'p5', name: 'Borraccia termica acciaio', image: '🍶', supplier: 'EU Local Warehouse', cost: 5.2, price: 19.9, stock: 240, sold: 95, status: 'active' },
  { id: 'p6', name: 'Supporto telefono auto', image: '📱', supplier: 'CJ Dropshipping', cost: 3.1, price: 14.9, stock: 48, sold: 142, status: 'paused' },
]

export const orders: Order[] = [
  { id: '#1042', product: 'Smartwatch fitness', customer: 'Marco R.', total: 34.9, status: 'processing', date: '2026-06-13' },
  { id: '#1041', product: 'Cuffie wireless ANC', customer: 'Giulia P.', total: 39.9, status: 'shipped', date: '2026-06-13' },
  { id: '#1040', product: 'Mini proiettore portatile HD', customer: 'Luca B.', total: 49.9, status: 'delivered', date: '2026-06-12' },
  { id: '#1039', product: 'Borraccia termica acciaio', customer: 'Sara M.', total: 19.9, status: 'pending', date: '2026-06-12' },
  { id: '#1038', product: 'Supporto telefono auto', customer: 'Davide T.', total: 14.9, status: 'delivered', date: '2026-06-11' },
  { id: '#1037', product: 'Smartwatch fitness', customer: 'Elena F.', total: 34.9, status: 'cancelled', date: '2026-06-10' },
]

export const suppliers: Supplier[] = [
  { id: 's1', name: 'CJ Dropshipping', country: 'CN / EU', products: 1240, rating: 4.7, avgShipping: '6-10 gg' },
  { id: 's2', name: 'EU Local Warehouse', country: 'Germania', products: 320, rating: 4.8, avgShipping: '2-4 gg' },
  { id: 's3', name: 'AliExpress Choice', country: 'Cina', products: 5400, rating: 4.5, avgShipping: '7-12 gg' },
  { id: 's4', name: 'Temu Supply', country: 'Cina', products: 2100, rating: 4.3, avgShipping: '8-14 gg' },
]

export const revenueSeries: PricePoint[] = [
  { date: 'Gen', revenue: 4200, cost: 1900 },
  { date: 'Feb', revenue: 5100, cost: 2300 },
  { date: 'Mar', revenue: 6800, cost: 2950 },
  { date: 'Apr', revenue: 6200, cost: 2700 },
  { date: 'Mag', revenue: 8900, cost: 3800 },
  { date: 'Giu', revenue: 11200, cost: 4600 },
]

export const stats = {
  revenue: 11200,
  orders: 318,
  activeProducts: products.filter((p) => p.status === 'active').length,
  avgMargin: 64,
}
