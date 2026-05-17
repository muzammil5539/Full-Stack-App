import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAuthToken, setAuthToken, clearAuthToken } from './token'

// Manual localStorage mock since bun test + vitest + jsdom might not be cooperating perfectly
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Also need to mock Storage prototype for spyOn to work if we want to test error cases
// But bun's globalThis.localStorage might not be an instance of Storage
if (!(globalThis as any).Storage) {
  (globalThis as any).Storage = class {}
  Object.setPrototypeOf(localStorageMock, (globalThis as any).Storage.prototype)
}

describe('auth/token', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getAuthToken', () => {
    it('returns token when present in localStorage', () => {
      localStorage.setItem('auth_token', 'test-token')
      expect(getAuthToken()).toBe('test-token')
    })

    it('returns null when token is missing', () => {
      expect(getAuthToken()).toBeNull()
    })

    it('returns null when localStorage.getItem throws', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied')
      })
      expect(getAuthToken()).toBeNull()
    })
  })

  describe('setAuthToken', () => {
    it('sets token in localStorage', () => {
      setAuthToken('new-token')
      expect(localStorage.getItem('auth_token')).toBe('new-token')
    })

    it('handles localStorage.setItem errors gracefully', () => {
      const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded')
      })

      // Should not throw
      expect(() => setAuthToken('some-token')).not.toThrow()
      spy.mockRestore()
    })
  })

  describe('clearAuthToken', () => {
    it('removes token from localStorage', () => {
      localStorage.setItem('auth_token', 'token-to-remove')
      clearAuthToken()
      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('handles localStorage.removeItem errors gracefully', () => {
      const spy = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => clearAuthToken()).not.toThrow()
      spy.mockRestore()
    })
  })
})
