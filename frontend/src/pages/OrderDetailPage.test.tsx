import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OrderDetailPage from './OrderDetailPage'

vi.mock('../auth/useAuthToken', () => {
  return {
    useAuthToken: () => ({ isAuthenticated: true }),
  }
})

vi.mock('../api/accounts', () => {
  return {
    listMyAddresses: async () => [],
  }
})

const getOrderByIdMock = vi.fn()
const cancelOrderMock = vi.fn()
vi.mock('../api/orders', () => {
  return {
    getOrderById: (...args: unknown[]) => getOrderByIdMock(...args),
    cancelOrder: (...args: unknown[]) => cancelOrderMock(...args),
  }
})

const listPaymentsForOrderMock = vi.fn()
vi.mock('../api/payments', () => {
  return {
    listPaymentsForOrder: (...args: unknown[]) => listPaymentsForOrderMock(...args),
  }
})

describe('OrderDetailPage', () => {
  it('renders payments and allows cancelling an eligible order', async () => {
    getOrderByIdMock.mockResolvedValueOnce({
      id: 10,
      order_number: 'ORD-10',
      user: 1,
      status: 'pending',
      items: [],
      subtotal: '10.00',
      shipping_cost: '0.00',
      tax: '0.00',
      discount: '0.00',
      total: '10.00',
      shipping_address: null,
      billing_address: null,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    listPaymentsForOrderMock.mockResolvedValueOnce([
      { id: 1, order: 10, payment_method: 'stripe', status: 'pending', amount: '10.00', payment_date: new Date().toISOString() },
    ])

    cancelOrderMock.mockResolvedValueOnce({
      id: 10,
      order_number: 'ORD-10',
      user: 1,
      status: 'cancelled',
      items: [],
      subtotal: '10.00',
      shipping_cost: '0.00',
      tax: '0.00',
      discount: '0.00',
      total: '10.00',
      shipping_address: null,
      billing_address: null,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <MemoryRouter initialEntries={['/orders/10']}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('ORD-10')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/payments/i)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/stripe/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /cancel order/i }))
    await waitFor(() => expect(cancelOrderMock).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/status: cancelled/i)).toBeInTheDocument())
  })
})
