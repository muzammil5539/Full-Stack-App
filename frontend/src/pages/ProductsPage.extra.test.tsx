import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import ProductsPage from './ProductsPage'

describe('ProductsPage extra', () => {
  it('renders Products heading', () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Products/i })).toBeTruthy()
  })
})
