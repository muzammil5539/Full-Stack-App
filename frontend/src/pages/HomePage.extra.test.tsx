import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi, expect } from 'vitest'

vi.mock('../api/products', async () => {
  const actual = await vi.importActual<typeof import('../api/products')>('../api/products')
  return {
    ...actual,
    listProducts: vi.fn(async () => ({ count: 2, next: null, previous: null, results: [
      { id: 1, name: 'Featured 1', slug: 'f1', price: '9.00' },
      { id: 2, name: 'Featured 2', slug: 'f2', price: '19.00' },
    ] })),
    listCategories: vi.fn(async () => ({ count: 1, next: null, previous: null, results: [{ id: 10, name: 'Cat', slug: 'cat' }] })),
    listBrands: vi.fn(async () => ({ count: 1, next: null, previous: null, results: [{ id: 20, name: 'Brand', slug: 'brand' }] })),
  }
})

import HomePage from './HomePage'

describe('HomePage extra', () => {
  it('renders featured products when API returns them', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: /Featured/i })).toBeTruthy()
    expect(await screen.findByText('Featured 1')).toBeTruthy()
    expect(await screen.findByText('Featured 2')).toBeTruthy()
  })

  it('renders categories and brands links', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Cat')).toBeTruthy()
    expect(await screen.findByText('Brand')).toBeTruthy()
  })
})
