import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

vi.mock('../api/products', async () => {
  const actual = await vi.importActual<typeof import('../api/products')>('../api/products')
  return {
    ...actual,
    listProducts: vi.fn(async () => ({ count: 0, next: null, previous: null, results: [] })),
    listCategories: vi.fn(async () => ({ count: 0, next: null, previous: null, results: [] })),
    listBrands: vi.fn(async () => ({ count: 0, next: null, previous: null, results: [] })),
  }
})

describe('HomePage', () => {
  it('renders primary CTA links', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByRole('link', { name: /shop products/i })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /shop products/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /view cart/i })).toHaveAttribute('href', '/cart')
  })
})
