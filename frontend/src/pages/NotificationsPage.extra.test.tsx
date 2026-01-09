import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi, expect } from 'vitest'

vi.mock('../api/notifications', () => ({ listNotifications: vi.fn(async () => []), markAllNotificationsRead: vi.fn(async () => {}) }))
vi.mock('../auth/useAuthToken', () => ({ useAuthToken: vi.fn() }))

import NotificationsPage from './NotificationsPage'
import { listNotifications, markAllNotificationsRead } from '../api/notifications'
import { useAuthToken } from '../auth/useAuthToken'

describe('NotificationsPage extra', () => {
  it('calls markAllNotificationsRead when button clicked', async () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })
    ;(listNotifications as any).mockResolvedValueOnce([{ id: 1, title: 'T1', message: 'M1', is_read: false, notification_type: 'info' }])

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    const btn = await screen.findByRole('button', { name: /Mark all as read/i })
    await userEvent.click(btn)
    expect(markAllNotificationsRead).toHaveBeenCalled()
  })

  it('renders list items from API', async () => {
    ;(useAuthToken as any).mockReturnValue({ isAuthenticated: true })
    ;(listNotifications as any).mockResolvedValueOnce([
      { id: 2, title: 'Hello', message: 'World', is_read: false, notification_type: 'info' },
    ])

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Hello')).toBeTruthy()
    expect(await screen.findByText(/Unread/i)).toBeTruthy()
  })
})
