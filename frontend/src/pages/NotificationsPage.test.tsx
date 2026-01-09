import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import NotificationsPage from './NotificationsPage'

vi.mock('../auth/useAuthToken', () => {
  return {
    useAuthToken: () => ({ isAuthenticated: true }),
  }
})

const listNotificationsMock = vi.fn()
const markAllMock = vi.fn()
vi.mock('../api/notifications', () => {
  return {
    listNotifications: (...args: unknown[]) => listNotificationsMock(...args),
    markAllNotificationsRead: (...args: unknown[]) => markAllMock(...args),
  }
})

describe('NotificationsPage', () => {
  it('renders notifications and marks all as read', async () => {
    listNotificationsMock.mockResolvedValue([
      { id: 1, user: 1, title: 'Hello', message: 'Welcome', notification_type: 'info', is_read: false, created_at: new Date().toISOString() },
      { id: 2, user: 1, title: 'Update', message: 'Order shipped', notification_type: 'order', is_read: true, created_at: new Date().toISOString() },
    ])

    markAllMock.mockResolvedValueOnce({ status: 'ok' })

    const user = userEvent.setup()
    render(<NotificationsPage />)

    await waitFor(() => expect(screen.getByText('Notifications')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument())
    expect(screen.getByText('Update')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /mark all as read/i }))
    await waitFor(() => expect(markAllMock).toHaveBeenCalled())
  })
})
