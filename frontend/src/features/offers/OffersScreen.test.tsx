import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../../api/client'
import type { Offer, Session } from '../../api/types'
import { OffersScreen } from './OffersScreen'

const offers: Offer[] = [
  {
    id: 1,
    name: 'Cereal de avena',
    emoji: '🥣',
    category: 'Despensa',
    original_price: '20.00',
    promo_price: '16.00',
    saving: '4.00',
    label: '500 g, combina con tu leche',
  },
  {
    id: 2,
    name: 'Mantequilla',
    emoji: '🧈',
    category: 'Lácteos',
    original_price: '15.50',
    promo_price: '13.50',
    saving: '2.00',
    label: '250 g, va bien con tu pan',
  },
  {
    id: 3,
    name: 'Jugo de naranja',
    emoji: '🧃',
    category: 'Bebidas',
    original_price: '18.00',
    promo_price: '15.00',
    saving: '3.00',
    label: '1 litro, para el desayuno',
  },
]

const session: Session = {
  id: 12,
  status: 'active',
  items: [],
  totals: { items_count: 0, subtotal: '0.00', vat: '0.00', total: '0.00' },
  budget: { amount: null, used_percent: 0, remaining: null, level: 'none' },
}

function renderOffers() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OffersScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OffersScreen', () => {
  beforeEach(() => {
    tokenStorage.set('cart-token')
    vi.restoreAllMocks()
  })

  it('muestra hasta tres ofertas con total y pasillo provisional', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ offers }), { status: 200 }),
      )

    renderOffers()

    expect(await screen.findByText('Cereal de avena')).toBeInTheDocument()
    expect(screen.getByText('Total actual: Q0.00')).toBeInTheDocument()
    expect(screen.getAllByText('Pasillo 4')).toHaveLength(3)
    expect(screen.getByText('Ahorras Q4.00')).toBeInTheDocument()
  })

  it('quita la oferta agregada y actualiza la sesión en caché', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ offers }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...session, items: [] }), {
          status: 200,
        }),
      )

    renderOffers()
    await screen.findByText('Cereal de avena')
    fireEvent.click(screen.getAllByRole('button', { name: /Agregar/ })[0])

    await waitFor(() =>
      expect(screen.queryByText('Cereal de avena')).not.toBeInTheDocument(),
    )
    expect(
      screen.getByText('Oferta agregada a tu carrito.'),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[2]?.[0]).toContain(
      '/sessions/current/offers/1/add',
    )
  })

  it.each([
    [422, 'Este producto ya está en tu carrito.'],
    [404, 'Esta oferta ya no está disponible.'],
  ])(
    'muestra un mensaje claro y recarga la lista si agregar devuelve %s',
    async (status, message) => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify(session), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ offers }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message }), { status }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ offers }), { status: 200 }),
        )

      renderOffers()
      await screen.findByText('Cereal de avena')
      fireEvent.click(screen.getAllByRole('button', { name: /Agregar/ })[0])

      expect(await screen.findByRole('status')).toHaveTextContent(message)
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
      expect(screen.getByText('Cereal de avena')).toBeInTheDocument()
    },
  )
})
