import type { ApiError } from './types'

const apiUrl =
  import.meta.env.VITE_API_URL ?? 'https://smartcart-api.test/api/v1'
const tokenKey = 'smartcart.access_token'

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiRequestError'
  }
}

export const tokenStorage = {
  get: () => sessionStorage.getItem(tokenKey),
  set: (token: string) => sessionStorage.setItem(tokenKey, token),
  clear: () => sessionStorage.removeItem(tokenKey),
}

let refreshPromise: Promise<string | null> | null = null

const requestRefresh = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise
  const currentToken = tokenStorage.get()
  if (!currentToken) return null

  refreshPromise = fetch(`${apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
  })
    .then(async (response) => {
      if (!response.ok) return null
      const body = (await response.json()) as { access_token?: string }
      if (!body.access_token) return null
      tokenStorage.set(body.access_token)
      return body.access_token
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { skipRefresh?: boolean } = {},
): Promise<T> {
  const { skipRefresh = false, ...requestInit } = init
  const makeRequest = (token: string | null) => {
    const headers = new Headers(requestInit.headers)
    headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${apiUrl}${path}`, { ...requestInit, headers })
  }

  let response = await makeRequest(tokenStorage.get())
  if (response.status === 401 && !skipRefresh) {
    const refreshedToken = await requestRefresh()
    if (!refreshedToken) {
      tokenStorage.clear()
      if (window.location.pathname !== '/') window.location.assign('/')
      throw new Error('Tu sesión expiró. Inicia sesión de nuevo.')
    }
    response = await makeRequest(refreshedToken)
  }
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new ApiRequestError(
      response.status,
      error.message ?? 'No fue posible completar la solicitud.',
    )
  }
  return (await response.json()) as T
}
