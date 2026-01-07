import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type CartItem = {
  id: number
  product: number
  variant: number | null
  quantity: number
  price: string
  subtotal: string
  product_details?: {
    id: number
    name: string
    slug: string
    price: string
    stock: number
  }
}

export type Cart = {
  id: number
  user: number
  items: CartItem[]
  total_price: string
  total_items: number
  created_at: string
  updated_at: string
}

export async function getMyCart(): Promise<Cart> {
  // CartViewSet.get_object ignores pk and returns the current user's cart.
  return getJson<Cart>(`${API_BASE_URL}/api/v1/cart/0/`)
}

export async function addCartItem(params: {
  product: number
  quantity?: number
  variant?: number | null
}): Promise<Cart> {
  return postJson<Cart>(`${API_BASE_URL}/api/v1/cart/add_item/`, {
    product: params.product,
    quantity: params.quantity ?? 1,
    variant: params.variant ?? null,
  })
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  return postJson<Cart>(`${API_BASE_URL}/api/v1/cart/remove_item/`, { item_id: itemId })
}

export async function setCartItemQuantity(itemId: number, quantity: number): Promise<Cart> {
  return postJson<Cart>(`${API_BASE_URL}/api/v1/cart/set_quantity/`, { item_id: itemId, quantity })
}

export async function incrementCartItem(itemId: number): Promise<Cart> {
  return postJson<Cart>(`${API_BASE_URL}/api/v1/cart/increment_item/`, { item_id: itemId })
}

export async function decrementCartItem(itemId: number): Promise<Cart> {
  return postJson<Cart>(`${API_BASE_URL}/api/v1/cart/decrement_item/`, { item_id: itemId })
}

export async function clearCart(): Promise<Cart> {
  return postJson<Cart>(`${API_BASE_URL}/api/v1/cart/clear/`, {})
}
