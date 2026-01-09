import { getJson, postJson, postMultipart } from './http'
import { clearCachePrefix } from './cache'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Payment = {
  id: number
  order: number
  payment_method: string
  transaction_id?: string
  status: string
  amount: string
  payment_date: string
  created_at?: string
  updated_at?: string
  proof_file?: string | null
  proof_status?: string
  proof_note?: string | null
  proof_uploaded_at?: string | null
}

export async function listPayments(): Promise<Payment[]> {
  const data = await getJson<PaginatedResponse<Payment>>(`${API_BASE_URL}/api/v1/payments/`)
  return data.results
}

export async function listPaymentsForOrder(orderId: number): Promise<Payment[]> {
  const data = await getJson<PaginatedResponse<Payment>>(`${API_BASE_URL}/api/v1/payments/?order=${orderId}`)
  return data.results
}

export async function createPaymentForOrder(params: {
  order: number
  payment_method: string
}): Promise<Payment> {
  const res = await postJson<Payment>(`${API_BASE_URL}/api/v1/payments/create_for_order/`, params)
  // Invalidate payments cache so UI refreshes
  try {
    clearCachePrefix('/api/v1/payments')
    clearCachePrefix('/api/v1/orders')
  } catch {
    // noop
  }
  return res
}

export async function uploadPaymentProof(paymentId: number, file: File, note?: string): Promise<Payment> {
  const fd = new FormData()
  fd.append('proof_file', file)
  if (note) fd.append('note', note)
  const res = await postMultipart<Payment>(`${API_BASE_URL}/api/v1/payments/${paymentId}/upload_proof/`, fd)
  try {
    clearCachePrefix('/api/v1/payments')
    clearCachePrefix('/api/v1/orders')
  } catch {
    // noop
  }
  return res
}
