import { getJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type User = {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  phone: string
  avatar: string | null
  is_verified: boolean
  is_staff: boolean
  is_superuser: boolean
}

export type Address = {
  id: number
  user: number
  address_type: 'billing' | 'shipping'
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export async function getMyUser(): Promise<User | null> {
  const data = await getJson<PaginatedResponse<User>>(`${API_BASE_URL}/api/v1/accounts/users/`)
  return data.results[0] ?? null
}

export async function listMyAddresses(): Promise<Address[]> {
  const data = await getJson<PaginatedResponse<Address>>(`${API_BASE_URL}/api/v1/accounts/addresses/`)
  return data.results
}
