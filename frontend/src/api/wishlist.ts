import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type WishlistItem = {
  id: number
  product: number
  created_at: string
  product_details?: {
    id: number
    name: string
    slug: string
    price: string
    stock: number
  }
}

export type Wishlist = {
  id: number
  user: number
  items: WishlistItem[]
  created_at: string
  updated_at: string
}

export async function getMyWishlist(): Promise<Wishlist> {
  // WishlistViewSet.get_object ignores pk and returns the current user's wishlist.
  return getJson<Wishlist>(`${API_BASE_URL}/api/v1/wishlist/0/`)
}

export async function addWishlistItem(productId: number): Promise<Wishlist> {
  return postJson<Wishlist>(`${API_BASE_URL}/api/v1/wishlist/add_item/`, { product: productId })
}

export async function removeWishlistItem(productId: number): Promise<Wishlist> {
  return postJson<Wishlist>(`${API_BASE_URL}/api/v1/wishlist/remove_item/`, { product: productId })
}
