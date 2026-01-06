import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type Category = {
  id: number
  name: string
  slug: string
  description?: string
  parent?: number | null
  is_active: boolean
}

export type Brand = {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
}

export type Product = {
  id: number
  name: string
  slug: string
  description: string
  short_description?: string
  category: number
  brand?: number | null
  sku: string
  price: string
  compare_price?: string | null
  stock: number
  is_active: boolean
  is_featured: boolean
}

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listPublicCategories(): Promise<PaginatedResponse<Category>> {
  return getJson<PaginatedResponse<Category>>(`${API_BASE_URL}/api/v1/products/categories/`)
}

export async function listPublicBrands(): Promise<PaginatedResponse<Brand>> {
  return getJson<PaginatedResponse<Brand>>(`${API_BASE_URL}/api/v1/products/brands/`)
}

export async function createCategory(payload: Partial<Category>): Promise<Category> {
  return postJson<Category>(`${API_BASE_URL}/api/v1/products/admin/categories/`, payload)
}

export async function createBrand(payload: Partial<Brand>): Promise<Brand> {
  return postJson<Brand>(`${API_BASE_URL}/api/v1/products/admin/brands/`, payload)
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  return postJson<Product>(`${API_BASE_URL}/api/v1/products/admin/products/`, payload)
}
