import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProductsPage from './ProductsPage'

vi.mock('../features/products/components/ProductList', () => {
  return {
    default: function MockProductList() {
      return <div>Mock ProductList</div>
    },
  }
})

describe('ProductsPage', () => {
  it('renders header and product list container', () => {
    render(<ProductsPage />)

    expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument()
    expect(screen.getByText(/mock productlist/i)).toBeInTheDocument()
  })
})
