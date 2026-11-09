import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminScreen } from './AdminScreen'

function mockAdminApi() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith('/auth/login')) {
      return new Response(
        JSON.stringify({
          access_token: 'admin-token',
          user: { role: 'admin' },
        }),
        { status: 200 },
      )
    }
    if (url.endsWith('/admin/products')) {
      return new Response(
        JSON.stringify({
          products: [
            {
              id: 1,
              name: 'Leche',
              barcode: '7401000000015',
              price: '11.75',
              active: true,
              category: { id: 1, name: 'Lácteos' },
            },
          ],
        }),
        { status: 200 },
      )
    }
    if (url.endsWith('/admin/promotions'))
      return new Response(JSON.stringify({ promotions: [] }), { status: 200 })
    if (url.endsWith('/admin/stats'))
      return new Response(
        JSON.stringify({
          sales_total: '0.00',
          orders_count: 0,
          top_products: [],
        }),
        { status: 200 },
      )
    return new Response(
      JSON.stringify({
        data: [
          {
            id: 7,
            total: '11.20',
            subtotal: '10.00',
            vat: '1.20',
            invoice_type: 'CF',
            nit: null,
            payment_method: 'card',
            exit_code: 'SC0725',
            requires_check: false,
            created_at: '2026-01-01T12:00:00Z',
            items: [
              { name_snapshot: 'Leche', quantity: 2, line_total: '11.20' },
            ],
          },
        ],
        current_page: 1,
        last_page: 1,
      }),
      { status: 200 },
    )
  })
}

describe('AdminScreen', () => {
  it('muestra pestañas, tabla y formularios de creación', async () => {
    mockAdminApi()
    render(<AdminScreen />)
    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'admin@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'local' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(
      await screen.findByText('Panel de administración'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Productos' }))
    expect(
      screen.getByRole('button', { name: 'Nuevo producto' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))
    expect(
      screen.getByRole('heading', { name: 'Nuevo producto' }),
    ).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    const opener = screen.getByRole('button', { name: 'Nuevo producto' })
    opener.focus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar formulario' }))
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Promociones' }))
    expect(
      screen.getByRole('button', { name: 'Nueva promoción' }),
    ).toBeInTheDocument()
  })

  it('vuelve al login con mensaje claro cuando expira el token admin', async () => {
    const fetchMock = mockAdminApi()
    render(<AdminScreen />)
    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'admin@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'local' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await screen.findByText('Panel de administración')
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: 'Token vencido' }), {
          status: 401,
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Promociones' }))
    await waitFor(() =>
      expect(
        screen.getByText(
          'Tu sesión de administrador expiró. Ingresa de nuevo.',
        ),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('heading', { name: 'Administración' }),
    ).toBeInTheDocument()
  })

  it('muestra vigencia nula, método y detalle de compras', async () => {
    const fetchMock = mockAdminApi()
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/auth/login')) {
        return new Response(
          JSON.stringify({
            access_token: 'admin-token',
            user: { role: 'admin' },
          }),
          { status: 200 },
        )
      }
      if (url.endsWith('/admin/products'))
        return new Response(JSON.stringify({ products: [] }), { status: 200 })
      if (url.endsWith('/admin/promotions'))
        return new Response(
          JSON.stringify({
            promotions: [
              {
                id: 1,
                product_id: 1,
                promo_price: '5.00',
                label: 'Oferta',
                starts_at: null,
                ends_at: null,
                active: true,
                product: { name: 'Leche', price: '11.75' },
              },
            ],
          }),
          { status: 200 },
        )
      if (url.endsWith('/admin/stats'))
        return new Response(
          JSON.stringify({
            sales_total: '0.00',
            orders_count: 0,
            top_products: [],
          }),
          { status: 200 },
        )
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 7,
              total: '11.20',
              subtotal: '10.00',
              vat: '1.20',
              invoice_type: 'CF',
              nit: null,
              payment_method: 'card',
              exit_code: 'SC0725',
              requires_check: false,
              created_at: '2026-01-01T12:00:00Z',
              items: [
                { name_snapshot: 'Leche', quantity: 2, line_total: '11.20' },
              ],
            },
          ],
          current_page: 1,
          last_page: 1,
        }),
        { status: 200 },
      )
    })
    render(<AdminScreen />)
    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'admin@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'local' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await screen.findByText('Panel de administración')
    fireEvent.click(screen.getByRole('button', { name: 'Promociones' }))
    expect(await screen.findByText('Sin vigencia')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Compras' }))
    expect(await screen.findByText('Tarjeta')).toBeInTheDocument()
    expect(screen.getByText('Aprobada')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(await screen.findByText('2 × Leche')).toBeInTheDocument()
    expect(screen.getByText('Subtotal:')).toBeInTheDocument()
  })
})
