import { getJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Review = {
  id: number
  product: number
  rating: number
  title: string
  comment: string
  user_name: string
  created_at: string
}

export async function listReviews(productId?: number): Promise<Review[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/reviews/`)
  if (productId) url.searchParams.set('product', String(productId))
  const data = await getJson<PaginatedResponse<Review>>(url.toString())
  return data.results
}
