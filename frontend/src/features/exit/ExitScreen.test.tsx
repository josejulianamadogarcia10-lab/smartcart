import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../../api/client'
import { useDemoStore } from '../../state/demoStore'
import { ExitScreen } from './ExitScreen'

function renderExit(
  initialEntry: string | { pathname: string; state?: unknown } = {
    pathname: '/exit',
    state: { orderId: 22 },
  },
  exitData?: { exit_code: string; requires_check: boolean },
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  if (exitData) queryClient.setQueryData(['order-exit', 22], exitData)
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

  afterEach(() => {
    vi.useRealTimers()
    useDemoStore.getState().resetDemo()
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
    expect(screen.getByText('Volviendo al inicio en 120 s')).toBeInTheDocument()
    expect(screen.getByLabelText('Código QR de salida')).toHaveAttribute(
      'aria-label',
      'Código QR de salida',
    )
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/orders/22/exit')
  })

  it('cierra sesión, limpia el estado y navega a una nueva compra', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        if (String(input).endsWith('/auth/logout')) {
          return new Response(null, { status: 204 })
        }
        return new Response(
          JSON.stringify({ exit_code: 'SC0725', requires_check: false }),
          { status: 200 },
        )
      })

    useDemoStore.setState({ forceCheck: true, simulateFailure: true })
    renderExit()
    await screen.findByText('SC0725')
    fireEvent.click(screen.getByRole('button', { name: 'Nueva compra' }))

    expect(await screen.findByText('Inicio')).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
    expect(useDemoStore.getState().forceCheck).toBe(false)
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).endsWith('/auth/logout'),
      ),
    ).toBe(true)
  })

  it('regresa al inicio cuando la cuenta regresiva llega a cero', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    )

    renderExit(undefined, { exit_code: 'SC0725', requires_check: false })
    expect(screen.getByText('Volviendo al inicio en 60 s')).toBeInTheDocument()
    for (let second = 0; second < 61; second += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }

    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })

  it('cancela el regreso automático sin reiniciarlo', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 }),
    )

    renderExit(undefined, { exit_code: 'SC0725', requires_check: false })
    expect(screen.getByText('Volviendo al inicio en 60 s')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar regreso' }))
    expect(
      screen.getByText('Regreso automático cancelado.'),
    ).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(61_000)
    })
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument()
    expect(
      screen.getByText('Regreso automático cancelado.'),
    ).toBeInTheDocument()
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
