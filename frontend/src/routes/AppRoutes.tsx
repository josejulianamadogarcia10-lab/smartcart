import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { QrCode, UserRound } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CartLine } from '../components/CartLine'
import { DonutProgress } from '../components/DonutProgress'
import { TopBar } from '../components/TopBar'
import type { Item } from '../api/types'
import { apiFetch, tokenStorage } from '../api/client'
import { CartScreen } from '../features/cart/CartScreen'
import { OffersScreen } from '../features/offers/OffersScreen'
import { CheckoutScreen } from '../features/checkout/CheckoutScreen'
import { ExitScreen } from '../features/exit/ExitScreen'
import { AdminScreen } from '../features/admin/AdminScreen'

const demoItem: Item = {
  id: 1,
  product: { name: 'Leche entera 1 litro', category: 'Lácteos', emoji: '🥛' },
  quantity: 2,
  unit_price: '11.75',
  line_total: '23.50',
  promo_applied: false,
  is_new: true,
}

function Page({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <h1 className="text-4xl font-black text-ink">{title}</h1>
        {children}
      </main>
    </>
  )
}
function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<'guest' | 'qr' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastMode, setLastMode] = useState<'guest' | 'qr'>('guest')

  const startPurchase = async (mode: 'guest' | 'qr') => {
    setLastMode(mode)
    setLoading(mode)
    setError(null)
    try {
      const auth = await apiFetch<{ access_token: string }>(
        mode === 'guest' ? '/auth/guest' : '/auth/qr',
        {
          method: 'POST',
          body: JSON.stringify(
            mode === 'guest'
              ? { device_code: 'CART-07' }
              : { qr_code: 'SC-DEMO-0001', device_code: 'CART-07' },
          ),
          skipRefresh: true,
        },
      )
      tokenStorage.set(auth.access_token)
      await apiFetch('/sessions', { method: 'POST', body: '{}' })
      navigate('/cart')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ''
      setError(
        message.includes('Failed to fetch') || message.includes('Network')
          ? 'No pudimos conectar con el servidor'
          : message,
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <TopBar />
      <main className="grid min-h-[calc(100vh-88px)] gap-6 bg-surface px-8 py-7 lg:grid-cols-[1.7fr_1fr]">
        <Card className="flex flex-col justify-center bg-gradient-to-br from-white to-brand-100 px-10 py-12 lg:px-10">
          <p className="text-2xl font-bold text-brand-700">Compra sin filas</p>
          <h1 className="mt-6 max-w-xl text-6xl font-black leading-[1.05] text-ink">
            ¡Bienvenido a SmartCart!
          </h1>
          <p className="mt-7 text-2xl text-muted">
            Escanea, controla tu gasto y paga sin hacer fila.
          </p>
          <div className="mt-8 grid gap-5">
            <Button
              disabled={loading !== null}
              onClick={() => void startPurchase('qr')}
            >
              <span className="flex items-center justify-center gap-3">
                <QrCode size={30} />
                {loading === 'qr'
                  ? 'Conectando…'
                  : 'Iniciar con el QR de mi app'}
              </span>
            </Button>
            <Button
              variant="secondary"
              disabled={loading !== null}
              onClick={() => void startPurchase('guest')}
              className="border-2 border-brand-500 text-brand-700 shadow-none"
            >
              <span className="flex items-center justify-center gap-3">
                <UserRound size={30} />
                {loading === 'guest' ? 'Conectando…' : 'Comprar como invitado'}
              </span>
            </Button>
          </div>
          {error && (
            <div
              role="alert"
              className="mt-6 flex items-center justify-between gap-4 rounded-card border-2 border-danger bg-white p-4 text-lg font-bold text-danger"
            >
              <span>{error}</span>
              <button
                className="underline"
                onClick={() => void startPurchase(lastMode)}
              >
                Reintentar
              </button>
            </div>
          )}
        </Card>
        <Card className="flex flex-col items-center justify-center px-8 py-10">
          <h2 className="text-2xl font-black text-ink">
            Muestra tu QR al lector
          </h2>
          <div className="mt-5 rounded-card border-4 border-surface bg-white p-3">
            <QRCodeSVG
              aria-label="Código QR de demostración SC-DEMO-0001"
              value="SC-DEMO-0001"
              size={220}
              fgColor="var(--color-ink)"
            />
          </div>
          <ol className="mt-7 grid w-full max-w-sm gap-4 text-xl text-ink">
            <li className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full bg-brand-700 font-black text-white">
                1
              </span>
              Abre la app del súper
            </li>
            <li className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full bg-brand-700 font-black text-white">
                2
              </span>
              Muestra tu código QR
            </li>
            <li className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full bg-brand-700 font-black text-white">
                3
              </span>
              ¡Empieza a comprar!
            </li>
          </ol>
        </Card>
      </main>
    </>
  )
}
function Cart() {
  return <CartScreen />
}
function DemoUi() {
  return (
    <Page title="Componentes de SmartCart">
      <div className="grid gap-5">
        <CartLine
          item={demoItem}
          onIncrease={() => undefined}
          onDecrease={() => undefined}
          onRemove={() => undefined}
        />
        <DonutProgress percent={70} />
      </div>
    </Page>
  )
}
function ProtectedRoute({ children }: { children: ReactNode }) {
  return tokenStorage.get() ? children : <Navigate to="/" replace />
}

function ClientKioskGuard() {
  const location = useLocation()

  useEffect(() => {
    const isClientScreen = !location.pathname.startsWith('/admin')
    if (!isClientScreen) return
    const preventContextMenu = (event: MouseEvent) => event.preventDefault()
    const preventGestureZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('touchmove', preventGestureZoom, {
      passive: false,
    })
    document.documentElement.classList.add('kiosk-client')
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('touchmove', preventGestureZoom)
      document.documentElement.classList.remove('kiosk-client')
    }
  }, [location.pathname])
  return null
}

export function AppRoutes() {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  return (
    <>
      <ClientKioskGuard />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offers"
          element={
            <ProtectedRoute>
              <OffersScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exit"
          element={
            <ProtectedRoute>
              <ExitScreen />
            </ProtectedRoute>
          }
        />
        {demoMode && <Route path="/dev/ui" element={<DemoUi />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
