export type Product = {
  id: string
  name: string
  image: string
  supplier: string
  cost: number
  price: number
  stock: number
  sold: number
  status: 'active' | 'paused' | 'out_of_stock'
}

export type Order = {
  id: string
  product: string
  customer: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  date: string
}

export type Supplier = {
  id: string
  name: string
  country: string
  products: number
  rating: number
  avgShipping: string
}

export type PricePoint = {
  date: string
  revenue: number
  cost: number
}
