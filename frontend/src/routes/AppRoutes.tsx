import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CartLine } from '../components/CartLine'
import { DonutProgress } from '../components/DonutProgress'
import { TopBar } from '../components/TopBar'
import type { Item } from '../api/types'
import { tokenStorage } from '../api/client'

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
  return (
    <Page title="Bienvenido a SmartCart">
      <Card>
        <p className="text-xl text-muted">Inicia una compra para comenzar.</p>
        <Button className="mt-6">Iniciar como invitado</Button>
      </Card>
    </Page>
  )
}
function Cart() {
  return (
    <Page title="Tu carrito">
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="grid gap-4">
          <CartLine item={demoItem} />
          <Button>Ir a pagar</Button>
        </div>
        <Card className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-black">Presupuesto</h2>
          <DonutProgress percent={70} />
          <p className="text-xl text-muted">Q70.25 de Q100.00</p>
        </Card>
      </div>
    </Page>
  )
}
function DemoUi() {
  return (
    <Page title="Componentes de SmartCart">
      <div className="grid gap-5">
        <CartLine item={demoItem} />
        <DonutProgress percent={70} />
      </div>
    </Page>
  )
}
function Placeholder({ title }: { title: string }) {
  return (
    <Page title={title}>
      <Card>
        <p className="text-xl text-muted">
          Esta pantalla estará disponible en la siguiente tarea.
        </p>
      </Card>
    </Page>
  )
}
function ProtectedRoute({ children }: { children: ReactNode }) {
  return tokenStorage.get() ? children : <Navigate to="/" replace />
}

export function AppRoutes() {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  return (
    <Routes>
      <Route path="/" element={<Home />} />
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
            <Placeholder title="Ofertas" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Placeholder title="Resumen y pago" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exit"
        element={
          <ProtectedRoute>
            <Placeholder title="Salida" />
          </ProtectedRoute>
        }
      />
      {demoMode && <Route path="/dev/ui" element={<DemoUi />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
