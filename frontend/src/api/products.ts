import { getJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ProductImage = {
  id: number
  image: string
  alt_text: string
  is_primary: boolean
  order: number
}

export type ProductVariant = {
  id: number
  product: number
  name: string
  value: string
  sku: string
  price_adjustment: string
  stock: number
  is_active: boolean
}

export type ProductAttribute = {
  id: number
  product: number
  name: string
  value: string
}

export type Product = {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price: string
  compare_price?: string | null
  stock: number
  category?: number
  category_name?: string
  brand?: number | null
  brand_name?: string | null
  is_on_sale?: boolean
  discount_percentage?: number
  images?: ProductImage[]
  variants?: ProductVariant[]
  attributes?: ProductAttribute[]
}

export async function listProducts(): Promise<PaginatedResponse<Product>> {
  return getJson<PaginatedResponse<Product>>(`${API_BASE_URL}/api/v1/products/`)
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return getJson<Product>(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(slug)}/`)
}
