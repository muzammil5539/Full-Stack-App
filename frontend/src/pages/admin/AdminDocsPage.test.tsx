import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AdminDocsPage from './AdminDocsPage'

vi.mock('../../admin/AdminRequired', () => {
  return {
    default: function AdminRequired({ children }: { children: React.ReactNode }) {
      return <>{children}</>
    },
  }
})

const getJsonMock = vi.fn()
vi.mock('../../api/http', async () => {
  const actual = await vi.importActual<typeof import('../../api/http')>('../../api/http')
  return {
    ...actual,
    getJson: (...args: unknown[]) => getJsonMock(...args),
  }
})

describe('AdminDocsPage', () => {
  it('loads docs list and renders selected doc content', async () => {
    getJsonMock
      .mockResolvedValueOnce({ docs: [{ name: 'API.md', title: 'Api' }, { name: 'DATABASE.md', title: 'Database' }] })
      .mockResolvedValueOnce({ name: 'API.md', title: 'Api', content_type: 'text/markdown', content: '# Hello' })

    render(
      <MemoryRouter>
        <AdminDocsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Documents')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('# Hello')).toBeInTheDocument())

    const user = userEvent.setup()
    getJsonMock.mockResolvedValueOnce({
      name: 'DATABASE.md',
      title: 'Database',
      content_type: 'text/markdown',
      content: '# DB',
    })
    await user.click(screen.getByRole('button', { name: /database/i }))
    await waitFor(() => expect(screen.getByText('# DB')).toBeInTheDocument())
  })
})
