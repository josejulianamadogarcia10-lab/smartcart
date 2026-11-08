import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../../api/client'
import type { Session } from '../../api/types'
import { CartScreen } from './CartScreen'

const session: Session = {
  id: 12,
  status: 'active',
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
    {
      id: 2,
      product: { name: 'Pan de caja', category: 'Panadería', emoji: '🍞' },
      quantity: 1,
      unit_price: '18.50',
      line_total: '18.50',
      promo_applied: false,
      is_new: false,
    },
    {
      id: 3,
      product: { name: 'Gaseosa 2 litros', category: 'Bebidas', emoji: '🥤' },
      quantity: 1,
      unit_price: '14.00',
      line_total: '14.00',
      promo_applied: false,
      is_new: false,
    },
    {
      id: 4,
      product: { name: 'Huevos docena', category: 'Frescos', emoji: '🥚' },
      quantity: 1,
      unit_price: '26.00',
      line_total: '26.00',
      promo_applied: false,
      is_new: true,
    },
  ],
  totals: { items_count: 4, subtotal: '62.72', vat: '7.53', total: '70.25' },
  budget: {
    amount: '100.00',
    used_percent: 70,
    remaining: '29.75',
    level: 'ok',
  },
}

function renderCart() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CartScreen', () => {
  beforeEach(() => {
    tokenStorage.set('cart-token')
    vi.restoreAllMocks()
  })

  it('carga la sesión del servidor y resalta solo la línea nueva', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(session), { status: 200 }),
    )
    renderCart()

    expect(screen.getByLabelText('Cargando carrito')).toBeInTheDocument()
    expect(await screen.findByText('Q70.25')).toBeInTheDocument()
    expect(screen.getAllByText('Recién escaneado')).toHaveLength(1)
    expect(screen.getByText('4 productos')).toBeInTheDocument()
  })

  it('envía el cambio de cantidad y actualiza la línea de inmediato', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(session), { status: 200 }),
    )
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...session,
          items: session.items.map((item) =>
            item.id === 1
              ? { ...item, quantity: 2, line_total: '23.50', is_new: false }
              : item,
          ),
        }),
        { status: 200 },
      ),
    )
    renderCart()
    await screen.findByText('Q70.25')
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Aumentar cantidad' })[0],
    )
    await waitFor(() =>
      expect(screen.getAllByText('2').length).toBeGreaterThan(0),
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ method: 'PATCH', body: '{"quantity":2}' }),
    )
  })

  it('muestra vacío cuando el servidor devuelve cero líneas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ...session,
          items: [],
          totals: { ...session.totals, items_count: 0, total: '0.00' },
        }),
        { status: 200 },
      ),
    )
    renderCart()
    expect(await screen.findByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ir a pagar/ })).toBeDisabled()
  })

  it('revierte la actualización optimista y avisa si la API falla', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(session), { status: 200 }),
    )
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: 'La cantidad máxima por línea es 99 unidades.',
        }),
        { status: 422 },
      ),
    )
    renderCart()
    await screen.findByText('Q70.25')
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Aumentar cantidad' })[0],
    )
    await screen.findByRole('alert')
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos actualizar la cantidad',
    )
  })
})
