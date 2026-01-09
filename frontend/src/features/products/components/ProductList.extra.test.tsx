import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi, expect } from 'vitest'

vi.mock('../../../features/products/hooks/useProducts', () => ({ useProducts: vi.fn() }))
vi.mock('../../../api/products', () => ({ listCategories: vi.fn(async () => ({ results: [] })), listBrands: vi.fn(async () => ({ results: [] })) }))
vi.mock('../../../auth/useAuthToken', () => ({ useAuthToken: vi.fn() }))

import { useProducts } from '../../../features/products/hooks/useProducts'
import ProductList from './ProductList'
import { useAuthToken } from '../../../auth/useAuthToken'

describe('ProductList extra', () => {
  it('shows no products message when list empty', () => {
    ;(useProducts as any).mockReturnValue({ products: [], loading: false, error: null, count: 0, next: null, previous: null })
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: false })

    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>
    )

    expect(screen.getByText(/No products found/i)).toBeTruthy()
  })

  it('pagination buttons disabled when no next/previous and enabled when present', () => {
    ;(useProducts as any).mockReturnValue({ products: [{ id: 1, name: 'A', slug: 'a', price: '1.00' }], loading: false, error: null, count: 1, next: null, previous: null })
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })

    const { rerender } = render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /Prev/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled()

    // Now simulate having next/previous
    ;(useProducts as any).mockReturnValue({ products: [{ id: 1, name: 'A', slug: 'a', price: '1.00' }], loading: false, error: null, count: 50, next: '/?page=2', previous: '/?page=1' })
    rerender(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /Prev/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled()
  })
})
