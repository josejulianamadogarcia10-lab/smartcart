import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../../api/client'
import { ExitScreen } from './ExitScreen'

function renderExit(
  initialEntry: string | { pathname: string; state?: unknown } = {
    pathname: '/exit',
    state: { orderId: 22 },
  },
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/exit" element={<ExitScreen />} />
          <Route path="/" element={<p>Inicio</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ExitScreen', () => {
  beforeEach(() => {
    tokenStorage.set('cart-token')
    vi.restoreAllMocks()
  })

  it('consulta el servidor y codifica únicamente el código de salida', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ exit_code: 'SC0725', requires_check: true }),
          { status: 200 },
        ),
      )

    renderExit()
    expect(await screen.findByText('SC0725')).toBeInTheDocument()
    expect(screen.getByText(/revisión aleatoria/)).toBeInTheDocument()
    expect(screen.getByLabelText('Código QR de salida')).toHaveAttribute(
      'aria-label',
      'Código QR de salida',
    )
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/orders/22/exit')
  })

  it('muestra un mensaje claro si se recarga y se pierde el order id', () => {
    renderExit('/exit')

    expect(
      screen.getByText('No encontramos el código de salida de esta compra.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    ).toBeInTheDocument()
  })
})
