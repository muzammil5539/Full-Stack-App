import { getJson } from './http'
import { getCache, setCache } from './cache'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string
  parent: number | null
  image: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type Brand = {
  id: number
  name: string
  slug: string
  description: string
  logo: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ProductImage = {
  id: number
  image: string
  image_url?: string | null
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
  is_featured?: boolean
  is_on_sale?: boolean
  discount_percentage?: number
  images?: ProductImage[]
  variants?: ProductVariant[]
  attributes?: ProductAttribute[]
}

type ListProductsParams = {
  search?: string
  ordering?: string
  category?: number
  brand?: number
  is_featured?: boolean
  page?: number
  page_size?: number
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const asString = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)
    if (asString.trim() === '') continue
    qs.set(key, asString)
  }
  const built = qs.toString()
  return built ? `?${built}` : ''
}

export async function listProducts(params: ListProductsParams = {}): Promise<PaginatedResponse<Product>> {
  const query = buildQuery({
    search: params.search,
    ordering: params.ordering,
    category: params.category,
    brand: params.brand,
    is_featured: params.is_featured,
    page: params.page,
    page_size: params.page_size,
  })
  const url = `${API_BASE_URL}/api/v1/products/${query}`
  // short-lived cache to reduce duplicate identical requests (useful for rapid UI navigation)
  const cached = getCache<PaginatedResponse<Product>>(url)
  if (cached) return cached
  const data = await getJson<PaginatedResponse<Product>>(url)
  setCache(url, data, 2000)
  return data
}

export async function listCategories(params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Category>> {
  const query = buildQuery({ page: params.page, page_size: params.page_size })
  const url = `${API_BASE_URL}/api/v1/products/categories/${query}`
  const cached = getCache<PaginatedResponse<Category>>(url)
  if (cached) return cached
  const data = await getJson<PaginatedResponse<Category>>(url)
  // categories are relatively static; cache for 5 minutes
  setCache(url, data, 5 * 60 * 1000)
  return data
}

export async function listBrands(params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Brand>> {
  const query = buildQuery({ page: params.page, page_size: params.page_size })
  const url = `${API_BASE_URL}/api/v1/products/brands/${query}`
  const cached = getCache<PaginatedResponse<Brand>>(url)
  if (cached) return cached
  const data = await getJson<PaginatedResponse<Brand>>(url)
  // brands change rarely; cache for 5 minutes
  setCache(url, data, 5 * 60 * 1000)
  return data
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return getJson<Product>(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(slug)}/`)
}
