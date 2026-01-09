import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../api/cart', () => ({ addCartItem: vi.fn() }))
vi.mock('../../../api/wishlist', () => ({ addWishlistItem: vi.fn() }))
vi.mock('../../../api/products', () => ({ listCategories: vi.fn(async () => ({ results: [] })), listBrands: vi.fn(async () => ({ results: [] })) }))
vi.mock('../../../auth/useAuthToken', () => ({ useAuthToken: vi.fn() }))
vi.mock('../hooks/useProducts', () => ({ useProducts: vi.fn() }))

import { addCartItem } from '../../../api/cart'
import { useAuthToken } from '../../../auth/useAuthToken'
import { useProducts } from '../hooks/useProducts'
import ProductList from './ProductList'

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables add-to-cart when user is not authenticated', () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: false })
    ;(useProducts as any).mockReturnValue({ products: [{ id: 1, name: 'Test', slug: 'test', price: '9.99', brand_name: 'B' }], loading: false, error: null, count: 1, next: null, previous: null })

    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>
    )

    const addBtn = screen.getByRole('button', { name: /add to cart/i })
    expect(addBtn).toBeDisabled()
  })

  it('calls addCartItem when authenticated and button clicked', async () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })
    ;(useProducts as any).mockReturnValue({ products: [{ id: 2, name: 'Widget', slug: 'widget', price: '12.00', brand_name: 'X' }], loading: false, error: null, count: 1, next: null, previous: null })
    ;(addCartItem as any).mockResolvedValue({})

    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>
    )

    const addBtn = screen.getByRole('button', { name: /add to cart/i })
    expect(addBtn).toBeEnabled()

    await userEvent.click(addBtn)
    expect(addCartItem).toHaveBeenCalledWith({ product: 2, quantity: 1 })
  })
})
