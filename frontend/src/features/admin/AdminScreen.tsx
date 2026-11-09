import { useState } from 'react'
import { apiFetch, ApiRequestError, tokenStorage } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'

interface AdminUser {
  role: string
}

interface Product {
  id: number
  name: string
  barcode: string
  price: string
  active: boolean
}

interface Stats {
  sales_total: string
  orders_count: number
  top_products: { name: string; quantity: number }[]
}

export function AdminScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadAdmin = async () => {
    const [productResponse, statsResponse] = await Promise.all([
      apiFetch<{ products: Product[] }>('/admin/products'),
      apiFetch<Stats>('/admin/stats'),
    ])
    setProducts(productResponse.products)
    setStats(statsResponse)
  }

  const login = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<{
        access_token: string
        user: AdminUser
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipRefresh: true,
      })
      if (response.user.role !== 'admin') {
        throw new ApiRequestError(403, 'No tienes permisos de administrador.')
      }
      tokenStorage.set(response.access_token)
      await loadAdmin()
      setLoggedIn(true)
    } catch (caught) {
      tokenStorage.clear()
      setError(
        caught instanceof Error
          ? caught.message
          : 'No fue posible iniciar sesión.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!loggedIn) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface px-6">
        <Card className="w-full max-w-xl p-10">
          <h1 className="text-4xl font-black text-ink">Administración</h1>
          <p className="mt-3 text-xl text-muted">
            Acceso exclusivo para administradores.
          </p>
          <form
            className="mt-8 grid gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              void login()
            }}
          >
            <label className="grid gap-2 text-xl font-bold text-ink">
              Correo
              <input
                className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-xl font-bold text-ink">
              Contraseña
              <input
                className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && (
              <p role="alert" className="text-lg font-bold text-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-5xl font-black text-ink">
            Panel de administración
          </h1>
          <Button
            variant="secondary"
            onClick={() => {
              tokenStorage.clear()
              setLoggedIn(false)
            }}
          >
            Cerrar sesión
          </Button>
        </div>
        {stats && (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Card className="p-6">
              <p className="text-lg text-muted">Ventas totales</p>
              <p className="text-4xl font-black text-brand-700">
                Q{stats.sales_total}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-lg text-muted">Compras</p>
              <p className="text-4xl font-black text-brand-700">
                {stats.orders_count}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-lg text-muted">Más vendidos</p>
              <p className="text-xl font-bold text-ink">
                {stats.top_products
                  .map((item) => `${item.name} (${item.quantity})`)
                  .join(', ') || 'Sin ventas'}
              </p>
            </Card>
          </div>
        )}
        <Card className="mt-8 overflow-hidden p-6">
          <h2 className="text-3xl font-black text-ink">Productos</h2>
          <div className="mt-4 grid gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 py-4 text-lg"
              >
                <span className="font-bold">
                  {product.name} · {product.barcode}
                </span>
                <span>
                  Q{product.price} · {product.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
