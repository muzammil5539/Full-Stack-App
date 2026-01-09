import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, vi, expect } from 'vitest'

vi.mock('../api/products', () => ({ getProductBySlug: vi.fn() }))
vi.mock('../api/cart', () => ({ addCartItem: vi.fn() }))
vi.mock('../api/reviews', () => ({ listReviews: vi.fn(async () => []), submitReview: vi.fn(), deleteReview: vi.fn() }))
vi.mock('../api/accounts', () => ({ getMyUser: vi.fn() }))
vi.mock('../auth/useAuthToken', () => ({ useAuthToken: vi.fn() }))

import ProductDetailPage from './ProductDetailPage'
import { getProductBySlug } from '../api/products'
import { useAuthToken } from '../auth/useAuthToken'

describe('ProductDetailPage extra', () => {
  it('shows unavailable variant as disabled', async () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })
    ;(getProductBySlug as any).mockResolvedValueOnce({
      id: 1,
      name: 'P',
      slug: 'p',
      price: '10.00',
      stock: 5,
      variants: [{ id: 11, value: 'X', is_active: true, stock: 0, price_adjustment: '0.00' }],
      images: [],
    })

    render(
      <MemoryRouter initialEntries={['/products/p']}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Select Variant/i)).toBeTruthy()
    expect(await screen.findByText(/Unavailable/i)).toBeTruthy()
    const btn = screen.getByRole('button', { name: /Unavailable/i })
    expect(btn).toBeDisabled()
  })

  it('disables add-to-cart when out of stock', async () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })
    ;(getProductBySlug as any).mockResolvedValueOnce({
      id: 2,
      name: 'Out',
      slug: 'out',
      price: '5.00',
      stock: 0,
      variants: [],
      images: [],
    })

    render(
      <MemoryRouter initialEntries={['/products/out']}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const addBtn = await screen.findByRole('button', { name: /Add to Cart/i })
    expect(addBtn).toBeDisabled()
  })

  it('renders image thumbnails when multiple images', async () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })
    ;(getProductBySlug as any).mockResolvedValueOnce({
      id: 3,
      name: 'WithImages',
      slug: 'wi',
      price: '7.00',
      stock: 3,
      variants: [],
      images: [
        { id: 1, image: '/a.png', image_url: null, alt_text: 'A', is_primary: true },
        { id: 2, image: '/b.png', image_url: null, alt_text: 'B', is_primary: false },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/products/wi']}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const as = await screen.findAllByAltText('A')
    expect(as.length).toBeGreaterThanOrEqual(1)
    expect(await screen.findByAltText('B')).toBeTruthy()
  })
})
