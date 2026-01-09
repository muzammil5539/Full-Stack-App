import { describe, it, expect, vi } from 'vitest'
import { getJson, postJson, getThrottleMetrics } from './http'

describe('http module', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('getJson throws with 401 status and parsed message', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Unauthorized' }),
      text: async () => JSON.stringify({ error: 'Unauthorized' }),
    })) as any

    await expect(getJson('/x')).rejects.toMatchObject({ message: expect.stringContaining('Unauthorized'), status: 401 })
  })

  it('postJson throws parsed validation messages', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ field: ['bad'] }),
      text: async () => JSON.stringify({ field: ['bad'] }),
    })) as any

    await expect(postJson('/x', { foo: 'bar' })).rejects.toMatchObject({ message: expect.stringContaining('field: bad'), status: 400 })
  })

  it('increments throttle metric when 429 encountered during retry', async () => {
    let calls = 0
    globalThis.fetch = vi.fn(async () => {
      calls += 1
      if (calls === 1) {
        return { ok: false, status: 429, headers: { get: () => null }, text: async () => '' } as any
      }
      return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ result: true }) } as any
    }) as any

    const res = await getJson('/retry')
    expect(res).toMatchObject({ result: true })
    const metrics = getThrottleMetrics()
    expect(metrics.throttleCount).toBeGreaterThanOrEqual(1)
  })
})
