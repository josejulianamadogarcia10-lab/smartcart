import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { apiFetch, ApiRequestError, tokenStorage } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TopBar } from '../../components/TopBar'

type Tab = 'summary' | 'products' | 'promotions' | 'orders'
type FieldErrors = Record<string, string[]>

interface AdminUser {
  role: string
}
interface Category {
  id: number
  name: string
}
interface Product {
  id: number
  name: string
  barcode: string
  price: string
  active: boolean
  category?: Category
}
interface Promotion {
  id: number
  product_id: number
  promo_price: string
  label: string
  starts_at: string | null
  ends_at: string | null
  active: boolean
  product: Product
}
interface Stats {
  sales_total: string
  orders_count: number
  top_products: { name: string; quantity: number }[]
}
interface AdminOrder {
  id: number
  total: string
  invoice_type: 'CF' | 'NIT'
  nit: string | null
  payment_method: string
  exit_code: string
  requires_check: boolean
  created_at: string
  subtotal: string
  vat: string
  items: { name_snapshot: string; quantity: number; line_total: string }[]
}
interface Paginator {
  data: AdminOrder[]
  current_page: number
  last_page: number
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Resumen' },
  { id: 'products', label: 'Productos' },
  { id: 'promotions', label: 'Promociones' },
  { id: 'orders', label: 'Compras' },
]

const emptyProduct = {
  category_id: '',
  barcode: '',
  name: '',
  description: '',
  price: '',
  image_emoji: '🛒',
  image_url: '',
  active: true,
  stock: '',
}
const emptyPromotion = {
  product_id: '',
  promo_price: '',
  label: '',
  starts_at: '',
  ends_at: '',
  active: true,
}

function fieldMessage(errors: FieldErrors, field: string): string | null {
  return errors[field]?.[0] ?? null
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-lg font-bold text-ink">
      {label}
      {children}
      {error && (
        <span className="text-base font-bold text-danger">{error}</span>
      )}
    </label>
  )
}

function StatusBadge({
  active,
  review = false,
}: {
  active?: boolean
  review?: boolean
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-base font-bold ${review ? 'bg-amber-500 text-white' : active ? 'bg-brand-100 text-brand-800' : 'bg-surface text-muted'}`}
    >
      {review ? 'Revisión' : active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export function AdminScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState<Tab>('summary')
  const [products, setProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Paginator | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FieldErrors>({})
  const [productForm, setProductForm] = useState(emptyProduct)
  const [promotionForm, setPromotionForm] = useState(emptyPromotion)
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState<'product' | 'promotion' | null>(null)
  const [productToDeactivate, setProductToDeactivate] =
    useState<Product | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)

  const adminFetch = <T,>(path: string, init: RequestInit = {}) =>
    apiFetch<T>(path, { ...init, skipRefresh: true })
  const handleError = (caught: unknown) => {
    if (caught instanceof ApiRequestError && caught.status === 401) {
      tokenStorage.clear()
      setLoggedIn(false)
      setError('Tu sesión de administrador expiró. Ingresa de nuevo.')
      return
    }
    setError(
      caught instanceof Error
        ? caught.message
        : 'No pudimos completar la solicitud.',
    )
  }

  const loadData = async (page = 1) => {
    const [productResponse, promotionResponse, statsResponse, orderResponse] =
      await Promise.all([
        adminFetch<{ products: Product[] }>('/admin/products'),
        adminFetch<{ promotions: Promotion[] }>('/admin/promotions'),
        adminFetch<Stats>('/admin/stats'),
        adminFetch<Paginator>(`/admin/orders?page=${page}`),
      ])
    setProducts(productResponse.products)
    setPromotions(promotionResponse.promotions)
    setStats(statsResponse)
    setOrders(orderResponse)
  }

  const login = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await adminFetch<{
        access_token: string
        user: AdminUser
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (response.user.role !== 'admin')
        throw new ApiRequestError(403, 'No tienes permisos de administrador.')
      tokenStorage.set(response.access_token)
      await loadData()
      setLoggedIn(true)
    } catch (caught) {
      tokenStorage.clear()
      handleError(caught)
    } finally {
      setLoading(false)
    }
  }

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setFormErrors({})
    setError(null)
    try {
      const path = editingProduct
        ? `/admin/products/${editingProduct}`
        : '/admin/products'
      await adminFetch(path, {
        method: editingProduct ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...productForm,
          category_id: Number(productForm.category_id),
          stock: productForm.stock ? Number(productForm.stock) : null,
        }),
      })
      setProductForm(emptyProduct)
      setEditingProduct(null)
      setFormOpen(null)
      setSuccess(editingProduct ? 'Producto actualizado.' : 'Producto creado.')
      await loadData()
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.status === 422)
        setFormErrors(caught.errors ?? {})
      else handleError(caught)
    } finally {
      setLoading(false)
    }
  }

  const savePromotion = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setFormErrors({})
    setError(null)
    try {
      const path = editingPromotion
        ? `/admin/promotions/${editingPromotion}`
        : '/admin/promotions'
      await adminFetch(path, {
        method: editingPromotion ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...promotionForm,
          product_id: Number(promotionForm.product_id),
          starts_at: promotionForm.starts_at || null,
          ends_at: promotionForm.ends_at || null,
        }),
      })
      setPromotionForm(emptyPromotion)
      setEditingPromotion(null)
      setFormOpen(null)
      setSuccess(
        editingPromotion ? 'Promoción actualizada.' : 'Promoción creada.',
      )
      await loadData()
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.status === 422)
        setFormErrors(caught.errors ?? {})
      else handleError(caught)
    } finally {
      setLoading(false)
    }
  }

  const deactivateProduct = async () => {
    if (!productToDeactivate) return
    try {
      await adminFetch(`/admin/products/${productToDeactivate.id}`, {
        method: 'DELETE',
      })
      setSuccess('Producto desactivado.')
      await loadData()
    } catch (caught) {
      handleError(caught)
    } finally {
      setProductToDeactivate(null)
    }
  }
  const togglePromotion = async (promotion: Promotion) => {
    try {
      await adminFetch(`/admin/promotions/${promotion.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          product_id: promotion.product_id,
          promo_price: promotion.promo_price,
          label: promotion.label,
          starts_at: promotion.starts_at,
          ends_at: promotion.ends_at,
          active: !promotion.active,
        }),
      })
      setSuccess(
        promotion.active ? 'Promoción desactivada.' : 'Promoción activada.',
      )
      await loadData()
    } catch (caught) {
      handleError(caught)
    }
  }

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.barcode}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [products, search],
  )
  if (!loggedIn)
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
            <Field label="Correo">
              <input
                className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="Contraseña">
              <input
                className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
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

  return (
    <>
      <TopBar title="Administración" user="Administrador" />
      <main className="min-h-[calc(100vh-78px)] bg-surface px-6 py-7">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-brand-700">
                Centro de control
              </p>
              <h1 className="text-5xl font-black text-ink">
                Panel de administración
              </h1>
            </div>
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
          <nav
            className="mt-8 flex flex-wrap gap-3"
            aria-label="Secciones de administración"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                className={`min-h-14 rounded-btn px-6 text-xl font-bold ${tab === item.id ? 'bg-brand-700 text-white' : 'bg-white text-ink'}`}
                onClick={() => {
                  setTab(item.id)
                  setError(null)
                  setSuccess(null)
                  void loadData().catch(handleError)
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {success && (
            <p
              role="status"
              className="mt-5 rounded-card border-2 border-ok bg-white p-4 text-lg font-bold text-ok"
            >
              {success}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-card border-2 border-danger bg-white p-4 text-lg font-bold text-danger"
            >
              {error}
            </p>
          )}
          {tab === 'summary' && stats && <Summary stats={stats} />}
          {tab === 'products' && (
            <Card className="mt-7 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-black text-ink">Productos</h2>
                <Button
                  onClick={() => {
                    setEditingProduct(null)
                    setProductForm(emptyProduct)
                    setFormErrors({})
                    setFormOpen('product')
                  }}
                >
                  Nuevo producto
                </Button>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-btn bg-surface px-4">
                <Search size={24} />
                <input
                  aria-label="Buscar productos"
                  className="min-h-14 flex-1 bg-transparent text-xl outline-none"
                  placeholder="Buscar por nombre o EAN"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <ProductTable
                products={filteredProducts}
                onEdit={(product) => {
                  setEditingProduct(product.id)
                  setProductForm({
                    ...emptyProduct,
                    ...product,
                    category_id: String(product.category?.id ?? ''),
                  })
                  setFormErrors({})
                  setFormOpen('product')
                }}
                onDeactivate={(product) => setProductToDeactivate(product)}
              />
            </Card>
          )}
          {tab === 'promotions' && (
            <Card className="mt-7 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-black text-ink">Promociones</h2>
                <Button
                  onClick={() => {
                    setEditingPromotion(null)
                    setPromotionForm(emptyPromotion)
                    setFormErrors({})
                    setFormOpen('promotion')
                  }}
                >
                  Nueva promoción
                </Button>
              </div>
              <PromotionTable
                promotions={promotions}
                onEdit={(promotion) => {
                  setEditingPromotion(promotion.id)
                  setPromotionForm({
                    product_id: String(promotion.product_id),
                    promo_price: promotion.promo_price,
                    label: promotion.label,
                    starts_at: promotion.starts_at?.slice(0, 16) ?? '',
                    ends_at: promotion.ends_at?.slice(0, 16) ?? '',
                    active: promotion.active,
                  })
                  setFormErrors({})
                  setFormOpen('promotion')
                }}
                onToggle={togglePromotion}
              />
            </Card>
          )}
          {tab === 'orders' && (
            <Card className="mt-7 overflow-x-auto p-6">
              <h2 className="text-3xl font-black text-ink">Compras</h2>
              <OrderTable
                orders={orders}
                onPage={(page) => void loadData(page)}
                onSelect={setSelectedOrder}
              />
            </Card>
          )}
          {formOpen === 'product' ? (
            <Modal
              title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
              onClose={() => {
                setFormOpen(null)
                setEditingProduct(null)
              }}
            >
              <ProductForm
                values={productForm}
                errors={formErrors}
                onChange={setProductForm}
                onSubmit={saveProduct}
                loading={loading}
              />
            </Modal>
          ) : null}
          {formOpen === 'promotion' ? (
            <Modal
              title={editingPromotion ? 'Editar promoción' : 'Nueva promoción'}
              onClose={() => {
                setFormOpen(null)
                setEditingPromotion(null)
              }}
            >
              <PromotionForm
                values={promotionForm}
                errors={formErrors}
                products={products}
                onChange={setPromotionForm}
                onSubmit={savePromotion}
                loading={loading}
              />
            </Modal>
          ) : null}
          {productToDeactivate ? (
            <Modal
              title="Desactivar producto"
              onClose={() => setProductToDeactivate(null)}
            >
              <p className="mt-6 text-xl text-ink">
                ¿Seguro que deseas desactivar {productToDeactivate.name}?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setProductToDeactivate(null)}
                >
                  Cancelar
                </Button>
                <Button onClick={() => void deactivateProduct()}>
                  Desactivar
                </Button>
              </div>
            </Modal>
          ) : null}
          {selectedOrder ? (
            <Modal
              title={`Compra ${selectedOrder.exit_code}`}
              onClose={() => setSelectedOrder(null)}
            >
              <div className="mt-6 grid gap-3 text-lg">
                {selectedOrder.items.map((item) => (
                  <div
                    key={`${item.name_snapshot}-${item.quantity}`}
                    className="flex justify-between border-b border-brand-100 pb-2"
                  >
                    <span>
                      {item.quantity} × {item.name_snapshot}
                    </span>
                    <span>Q{item.line_total}</span>
                  </div>
                ))}
                <p>
                  Subtotal: <strong>Q{selectedOrder.subtotal}</strong>
                </p>
                <p>
                  IVA: <strong>Q{selectedOrder.vat}</strong>
                </p>
                <p className="text-2xl font-black">
                  Total: Q{selectedOrder.total}
                </p>
              </div>
            </Modal>
          ) : null}
        </div>
      </main>
    </>
  )
}

function Summary({ stats }: { stats: Stats }) {
  const max = Math.max(...stats.top_products.map((item) => item.quantity), 1)
  return (
    <div className="mt-7 grid items-start gap-5 md:grid-cols-3">
      <Card className="h-fit p-5">
        <p className="text-lg text-muted">Ventas totales</p>
        <p className="text-4xl font-black text-brand-700">
          Q{stats.sales_total}
        </p>
      </Card>
      <Card className="h-fit p-5">
        <p className="text-lg text-muted">Compras</p>
        <p className="text-4xl font-black text-brand-700">
          {stats.orders_count}
        </p>
      </Card>
      <Card className="h-fit p-5">
        <h2 className="text-2xl font-black text-ink">Más vendidos</h2>
        <div className="mt-4 grid gap-4">
          {stats.top_products.length ? (
            stats.top_products.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-lg font-bold">
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                </div>
                <div
                  className="mt-1 h-4 w-full rounded-full bg-brand-100"
                  role="progressbar"
                  aria-valuenow={item.quantity}
                  aria-valuemin={0}
                  aria-valuemax={max}
                >
                  <div
                    className="h-4 rounded-full bg-brand-500"
                    style={{ width: `${(item.quantity / max) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-lg text-muted">Sin ventas todavía.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

function ProductTable({
  products,
  onEdit,
  onDeactivate,
}: {
  products: Product[]
  onEdit: (product: Product) => void
  onDeactivate: (product: Product) => void
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-lg">
        <thead>
          <tr className="border-b-2 border-brand-100 text-muted">
            <th className="p-3">Nombre</th>
            <th className="p-3">EAN</th>
            <th className="p-3">Categoría</th>
            <th className="p-3">Precio</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-brand-100">
              <td className="p-3 font-bold">{product.name}</td>
              <td className="p-3">{product.barcode}</td>
              <td className="p-3">{product.category?.name ?? '—'}</td>
              <td className="p-3">Q{product.price}</td>
              <td className="p-3">
                <StatusBadge active={product.active} />
              </td>
              <td className="flex gap-2 p-3">
                <Button className="text-base" onClick={() => onEdit(product)}>
                  Editar
                </Button>
                {product.active && (
                  <Button
                    className="text-base"
                    variant="secondary"
                    onClick={() => onDeactivate(product)}
                  >
                    Desactivar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!products.length && (
        <p className="p-6 text-center text-xl text-muted">
          No encontramos productos.
        </p>
      )}
    </div>
  )
}
function PromotionTable({
  promotions,
  onEdit,
  onToggle,
}: {
  promotions: Promotion[]
  onEdit: (promotion: Promotion) => void
  onToggle: (promotion: Promotion) => void
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-lg">
        <thead>
          <tr className="border-b-2 border-brand-100 text-muted">
            <th className="p-3">Producto</th>
            <th className="p-3">Normal</th>
            <th className="p-3">Oferta</th>
            <th className="p-3">Vigencia</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promotion) => (
            <tr key={promotion.id} className="border-b border-brand-100">
              <td className="p-3 font-bold">{promotion.product.name}</td>
              <td className="p-3">Q{promotion.product.price}</td>
              <td className="p-3">Q{promotion.promo_price}</td>
              <td className="p-3">
                {formatValidity(promotion.starts_at, promotion.ends_at)}
              </td>
              <td className="p-3">
                <StatusBadge active={promotion.active} />
              </td>
              <td className="flex gap-2 p-3">
                <Button className="text-base" onClick={() => onEdit(promotion)}>
                  Editar
                </Button>
                <Button
                  className="text-base"
                  variant="secondary"
                  onClick={() => onToggle(promotion)}
                >
                  {promotion.active ? 'Desactivar' : 'Activar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!promotions.length && (
        <p className="p-6 text-center text-xl text-muted">
          No hay promociones.
        </p>
      )}
    </div>
  )
}
function formatValidity(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt || !endsAt) return 'Sin vigencia'
  return `${new Date(startsAt).toLocaleDateString('es-GT')} – ${new Date(endsAt).toLocaleDateString('es-GT')}`
}

function OrderTable({
  orders,
  onPage,
  onSelect,
}: {
  orders: Paginator | null
  onPage: (page: number) => void
  onSelect: (order: AdminOrder) => void
}) {
  if (!orders)
    return <p className="p-6 text-xl text-muted">Cargando compras…</p>
  return (
    <>
      <table className="mt-5 w-full min-w-[900px] text-left text-lg">
        <thead>
          <tr className="border-b-2 border-brand-100 text-muted">
            <th className="p-3">Fecha</th>
            <th className="p-3">Total</th>
            <th className="p-3">Factura</th>
            <th className="p-3">Método</th>
            <th className="p-3">Salida</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {orders.data.map((order) => (
            <tr key={order.id} className="border-b border-brand-100">
              <td className="p-3">
                {new Date(order.created_at).toLocaleString('es-GT')}
              </td>
              <td className="p-3 font-bold">Q{order.total}</td>
              <td className="p-3">
                {order.invoice_type}
                {order.nit ? ` · ${order.nit}` : ''}
              </td>
              <td className="p-3">
                {order.payment_method === 'card'
                  ? 'Tarjeta'
                  : order.payment_method === 'fast_checkout'
                    ? 'Caja rápida'
                    : order.payment_method}
              </td>
              <td className="p-3">{order.exit_code}</td>
              <td className="p-3">
                {order.requires_check ? (
                  <StatusBadge review />
                ) : (
                  <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-base font-bold text-brand-800">
                    Aprobada
                  </span>
                )}
              </td>
              <td className="p-3">
                <Button className="text-base" onClick={() => onSelect(order)}>
                  Ver detalle
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5 flex items-center justify-between text-lg">
        <span>
          Página {orders.current_page} de {orders.last_page}
        </span>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            disabled={orders.current_page <= 1}
            onClick={() => onPage(orders.current_page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={orders.current_page >= orders.last_page}
            onClick={() => onPage(orders.current_page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      opener?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/70 p-6"
      style={{ position: 'fixed', inset: 0, zIndex: 100 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        style={{
          maxHeight: '90vh',
          width: 'min(100%, 42rem)',
          overflowY: 'auto',
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Card className="p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-ink">{title}</h2>
            <button aria-label="Cerrar formulario" onClick={onClose}>
              <X size={32} />
            </button>
          </div>
          {children}
        </Card>
      </div>
    </div>,
    document.body,
  )
}
function ProductForm({
  values,
  errors,
  onChange,
  onSubmit,
  loading,
}: {
  values: typeof emptyProduct
  errors: FieldErrors
  onChange: (value: typeof emptyProduct) => void
  onSubmit: (event: FormEvent) => void
  loading: boolean
}) {
  const update = (key: keyof typeof emptyProduct, value: string | boolean) =>
    onChange({ ...values, [key]: value })
  return (
    <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
      <Field label="Nombre" error={fieldMessage(errors, 'name')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          required
        />
      </Field>
      <Field label="EAN-13" error={fieldMessage(errors, 'barcode')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          maxLength={13}
          inputMode="numeric"
          value={values.barcode}
          onChange={(event) =>
            update('barcode', event.target.value.replace(/\D/g, ''))
          }
          required
        />
      </Field>
      <Field
        label="ID de categoría"
        error={fieldMessage(errors, 'category_id')}
      >
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          type="number"
          min="1"
          value={values.category_id}
          onChange={(event) => update('category_id', event.target.value)}
          required
        />
      </Field>
      <Field label="Precio" error={fieldMessage(errors, 'price')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          type="number"
          min="0.01"
          step="0.01"
          value={values.price}
          onChange={(event) => update('price', event.target.value)}
          required
        />
      </Field>
      <Field label="Emoji" error={fieldMessage(errors, 'image_emoji')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          value={values.image_emoji}
          onChange={(event) => update('image_emoji', event.target.value)}
          required
        />
      </Field>
      <Field label="Stock" error={fieldMessage(errors, 'stock')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          type="number"
          min="0"
          value={values.stock}
          onChange={(event) => update('stock', event.target.value)}
        />
      </Field>
      {fieldMessage(errors, 'description') && (
        <p className="text-base font-bold text-danger">
          {fieldMessage(errors, 'description')}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar producto'}
      </Button>
    </form>
  )
}
function PromotionForm({
  values,
  errors,
  products,
  onChange,
  onSubmit,
  loading,
}: {
  values: typeof emptyPromotion
  errors: FieldErrors
  products: Product[]
  onChange: (value: typeof emptyPromotion) => void
  onSubmit: (event: FormEvent) => void
  loading: boolean
}) {
  const update = (key: keyof typeof emptyPromotion, value: string) =>
    onChange({ ...values, [key]: value })
  return (
    <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
      <Field label="Producto" error={fieldMessage(errors, 'product_id')}>
        <select
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          value={values.product_id}
          onChange={(event) => update('product_id', event.target.value)}
          required
        >
          <option value="">Selecciona un producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Precio de oferta"
        error={fieldMessage(errors, 'promo_price')}
      >
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          type="number"
          min="0.01"
          step="0.01"
          value={values.promo_price}
          onChange={(event) => update('promo_price', event.target.value)}
          required
        />
      </Field>
      <Field label="Etiqueta" error={fieldMessage(errors, 'label')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          value={values.label}
          onChange={(event) => update('label', event.target.value)}
          required
        />
      </Field>
      <Field label="Inicio" error={fieldMessage(errors, 'starts_at')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          type="datetime-local"
          value={values.starts_at}
          onChange={(event) => update('starts_at', event.target.value)}
        />
      </Field>
      <Field label="Fin" error={fieldMessage(errors, 'ends_at')}>
        <input
          className="min-h-14 rounded-btn border-2 border-brand-100 px-4"
          type="datetime-local"
          value={values.ends_at}
          onChange={(event) => update('ends_at', event.target.value)}
        />
      </Field>
      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar promoción'}
      </Button>
    </form>
  )
}
