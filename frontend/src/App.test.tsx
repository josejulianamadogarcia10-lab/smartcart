import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { tokenStorage } from './api/client'

describe('App', () => {
  beforeEach(() => {
    tokenStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra la pantalla inicial de SmartCart', () => {
    render(<App />)

    expect(screen.getByText('SmartCart')).toBeInTheDocument()
    expect(screen.getByText('Carrito 07')).toBeInTheDocument()
    expect(screen.getByText('Lector conectado')).toBeInTheDocument()
  })

  it('autentica como invitado, crea la sesión y navega al carrito', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'guest-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            status: 'active',
            items: [],
            totals: {
              items_count: 0,
              subtotal: '0.00',
              vat: '0.00',
              total: '0.00',
            },
            budget: {
              amount: null,
              used_percent: 0,
              remaining: null,
              level: 'none',
            },
          }),
          { status: 200 },
        ),
      )

    render(<App />)
    fireEvent.click(
      screen.getByRole('button', { name: /Comprar como invitado/ }),
    )

    await waitFor(() =>
      expect(
        screen.getByText('Lector listo. Escanea el siguiente producto'),
      ).toBeInTheDocument(),
    )
    expect(tokenStorage.get()).toBe('guest-token')
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/auth/guest')
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ body: '{"device_code":"CART-07"}' }),
    )
  })

  it('autentica con el QR demo y crea la sesión', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'qr-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 2 }), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 2,
            status: 'active',
            items: [],
            totals: {
              items_count: 0,
              subtotal: '0.00',
              vat: '0.00',
              total: '0.00',
            },
            budget: {
              amount: null,
              used_percent: 0,
              remaining: null,
              level: 'none',
            },
          }),
          { status: 200 },
        ),
      )

    render(<App />)
    fireEvent.click(
      screen.getByRole('button', { name: /Iniciar con el QR de mi app/ }),
    )

    await waitFor(() =>
      expect(
        screen.getByText('Lector listo. Escanea el siguiente producto'),
      ).toBeInTheDocument(),
    )
    expect(tokenStorage.get()).toBe('qr-token')
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: '{"qr_code":"SC-DEMO-0001","device_code":"CART-07"}',
      }),
    )
  })

  it('muestra el error devuelto por un QR inválido', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'El código QR no es válido.' }), {
        status: 401,
      }),
    )

    render(<App />)
    fireEvent.click(
      screen.getByRole('button', { name: /Iniciar con el QR de mi app/ }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El código QR no es válido.',
    )
    expect(tokenStorage.get()).toBeNull()
  })

  it('muestra reintentar cuando no hay conexión', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    )

    render(<App />)
    fireEvent.click(
      screen.getByRole('button', { name: /Comprar como invitado/ }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos conectar con el servidor',
    )
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })
})
