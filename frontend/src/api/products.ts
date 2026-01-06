import { getJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Product = {
  id: number
  name: string
  slug: string
  price: string
  compare_price?: string | null
  stock: number
}

export async function listProducts(): Promise<PaginatedResponse<Product>> {
  return getJson<PaginatedResponse<Product>>(`${API_BASE_URL}/api/v1/products/`)
}
