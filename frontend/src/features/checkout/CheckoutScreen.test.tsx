import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../../api/client'
import type { SessionTotals } from '../../api/types'
import { CheckoutScreen } from './CheckoutScreen'

const totals: SessionTotals = {
  items_count: 1,
  subtotal: '10.49',
  vat: '1.26',
  total: '11.75',
}
const summary = {
  items: [
    {
      id: 1,
      product: {
        name: 'Leche entera 1 litro',
        category: 'Lácteos',
        emoji: '🥛',
      },
      quantity: 1,
      unit_price: '11.75',
      line_total: '11.75',
      promo_applied: false,
      is_new: false,
    },
  ],
  totals,
}
const order = {
  id: 22,
  shopping_session_id: 12,
  invoice_type: 'CF' as const,
  nit: null,
  subtotal: '10.49',
  vat: '1.26',
  total: '11.75',
  payment_method: 'card' as const,
  status: 'paid' as const,
  requires_check: false,
  exit_code: 'SC0725',
}

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/exit" element={<p>Código de salida recibido</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CheckoutScreen', () => {
  beforeEach(() => {
    tokenStorage.set('cart-token')
    vi.restoreAllMocks()
  })

  it('muestra los totales del servidor y envía CF sin NIT', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(summary), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ order }), { status: 201 }),
      )

    renderCheckout()
    expect((await screen.findAllByText('Q11.75')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ invoice_type: 'CF', payment_method: 'card' }),
      }),
    )
    expect(
      await screen.findByText('Código de salida recibido'),
    ).toBeInTheDocument()
  })

  it('muestra el 422 del NIT debajo del campo y no bloquea el reintento', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(summary), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'El NIT no es válido.' }), {
          status: 422,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ order }), { status: 201 }),
      )

    renderCheckout()
    await screen.findAllByText('Q11.75')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar NIT' }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '123456-9' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/ }))

    expect(await screen.findByText('El NIT no es válido.')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })

  it('mantiene el carrito intacto y permite reintentar si el pago falla', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(summary), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Pago rechazado.' }), {
          status: 422,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ order }), { status: 201 }),
      )

    renderCheckout()
    await screen.findAllByText('Q11.75')
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos procesar el pago',
    )
    expect(screen.getByText('Leche entera 1 litro')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Pagar con tarjeta/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })
})
