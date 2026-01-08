import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders primary CTA links', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /shop products/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /view cart/i })).toHaveAttribute('href', '/cart')
  })
})
