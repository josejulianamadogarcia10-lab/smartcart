import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, tokenStorage } from './client'

describe('apiFetch', () => {
  beforeEach(() => {
    tokenStorage.set('expired-token')
    vi.restoreAllMocks()
  })

  it('comparte un solo refresh cuando varias peticiones reciben 401', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'fresh-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: 'uno' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: 'dos' }), { status: 200 }),
      )

    const [first, second] = await Promise.all([
      apiFetch<{ ok: string }>('/one'),
      apiFetch<{ ok: string }>('/two'),
    ])

    expect(first.ok).toBe('uno')
    expect(second.ok).toBe('dos')
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(tokenStorage.get()).toBe('fresh-token')
  })
})
