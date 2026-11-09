import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ScanBarcode, Tag, TicketCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiRequestError, tokenStorage } from '../../api/client'
import type { Session } from '../../api/types'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CartLine } from '../../components/CartLine'
import { DonutProgress } from '../../components/DonutProgress'
import { TopBar } from '../../components/TopBar'
import { DemoPanel } from '../simulation/DemoPanel'
import { BudgetAlertController } from './BudgetAlert'
import { BudgetEditor } from './BudgetEditor'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { formatMoney } from '../../lib/money'
import { useDemoStore } from '../../state/demoStore'
import { useInactivityGuard } from '../../hooks/useInactivityGuard'

const sessionKey = ['shopping-session']
interface ScanResponse {
  session: Session
  scan: { result: string; message: string }
}

function CartSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Cargando carrito">
      {[1, 2, 3].map((item) => (
        <div
          className="h-[120px] animate-pulse rounded-card bg-brand-100"
          key={item}
        />
      ))}
    </div>
  )
}

export function CartScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState<string | null>(null)
  const [scannerNotice, setScannerNotice] = useState<string | null>(null)
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false)
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const togglePanel = useDemoStore((state) => state.togglePanel)
  const sessionQuery = useQuery({
    queryKey: sessionKey,
    queryFn: () => apiFetch<Session>('/sessions/current'),
    enabled: Boolean(tokenStorage.get()),
  })
  const returnToHome = useCallback(() => navigate('/'), [navigate])
  const inactivity = useInactivityGuard({
    isEmpty: sessionQuery.data?.items.length === 0,
    onReturn: returnToHome,
  })

  useEffect(() => {
    if (
      sessionQuery.error instanceof ApiRequestError &&
      [401, 404].includes(sessionQuery.error.status)
    ) {
      tokenStorage.clear()
      navigate('/')
    }
  }, [navigate, sessionQuery.error])

  useEffect(() => {
    if (!demoMode) return
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        togglePanel()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [demoMode, togglePanel])

  useEffect(
    () => () => {
      useDemoStore.getState().cancelScenario()
    },
    [],
  )

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      apiFetch<Session>(`/sessions/current/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    onMutate: async ({ itemId, quantity }) => {
      setNotice(null)
      await queryClient.cancelQueries({ queryKey: sessionKey })
      const previous = queryClient.getQueryData<Session>(sessionKey)
      if (previous)
        queryClient.setQueryData<Session>(sessionKey, {
          ...previous,
          items: previous.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  line_total: (Number(item.unit_price) * quantity).toFixed(2),
                  is_new: false,
                }
              : { ...item, is_new: false },
          ),
        })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(sessionKey, context.previous)
      setNotice('No pudimos actualizar la cantidad. Intenta de nuevo.')
    },
    onSuccess: (data) => queryClient.setQueryData(sessionKey, data),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiFetch<Session>(`/sessions/current/items/${itemId}`, {
        method: 'DELETE',
      }),
    onMutate: async (itemId) => {
      setNotice(null)
      await queryClient.cancelQueries({ queryKey: sessionKey })
      const previous = queryClient.getQueryData<Session>(sessionKey)
      if (previous)
        queryClient.setQueryData<Session>(sessionKey, {
          ...previous,
          items: previous.items
            .filter((item) => item.id !== itemId)
            .map((item) => ({ ...item, is_new: false })),
        })
      return { previous }
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous)
        queryClient.setQueryData(sessionKey, context.previous)
      setNotice('No pudimos eliminar el producto. Intenta de nuevo.')
    },
    onSuccess: (data) => queryClient.setQueryData(sessionKey, data),
  })

  const scanMutation = useMutation({
    mutationFn: ({
      barcode,
      source,
    }: {
      barcode: string
      source: 'reader' | 'simulation'
    }) =>
      apiFetch<ScanResponse>('/sessions/current/scan', {
        method: 'POST',
        body: JSON.stringify({ barcode, source }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionKey, data.session)
      setScannerNotice(null)
      setNotice(`Producto agregado: ${data.scan.message}`)
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        if (error.status === 404) {
          setScannerNotice('Este producto no está en el catálogo')
          return
        }
        if (error.status === 422) {
          setScannerNotice(
            error.message.includes('99')
              ? 'La cantidad máxima por línea es 99 unidades.'
              : 'Código no reconocido',
          )
          return
        }
      }
      setScannerNotice('Se perdió la conexión con el servidor')
    },
  })

  const budgetMutation = useMutation({
    mutationFn: (budget: string | null) =>
      apiFetch<Session>('/sessions/current/budget', {
        method: 'PUT',
        body: JSON.stringify({ budget }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionKey, data)
      setBudgetEditorOpen(false)
    },
  })

  const scanner = useBarcodeScanner({
    onScan: (barcode) =>
      scanMutation
        .mutateAsync({ barcode, source: 'reader' })
        .then(() => undefined),
    onInvalid: () => setScannerNotice('Código no reconocido'),
  })

  if (sessionQuery.isLoading)
    return (
      <CartLayout>
        <div aria-live="polite" className="sr-only">
          {notice}
        </div>
        {inactivity.warningVisible && (
          <p
            className="mb-4 rounded-card border-2 border-amber-500 bg-amber-500/10 p-4 text-lg font-bold text-amber-600"
            role="status"
          >
            No hay actividad reciente. Un toque, tecla o escaneo mantiene la
            compra abierta.
          </p>
        )}
        <CartSkeleton />
      </CartLayout>
    )
  if (sessionQuery.isError || !sessionQuery.data)
    return (
      <CartLayout>
        <Card className="p-10 text-center">
          <p className="text-xl font-bold text-danger">
            No pudimos conectar con el servidor.
          </p>
          <Button className="mt-6" onClick={() => void sessionQuery.refetch()}>
            Reintentar
          </Button>
        </Card>
      </CartLayout>
    )

  const session = sessionQuery.data
  const busy = updateMutation.isPending || removeMutation.isPending
  const empty = session.items.length === 0
  const resetDemo = async () => {
    await apiFetch('/sessions', { method: 'POST', body: '{}' })
    tokenStorage.clear()
    navigate('/')
  }

  const setDemoBudget = async () => {
    await budgetMutation.mutateAsync('100.00')
  }

  return (
    <>
      <CartLayout>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_380px]">
          <section className="grid content-start gap-4">
            <div className="flex min-h-[68px] items-center justify-between rounded-card bg-brand-100 px-7 text-xl font-bold text-brand-700">
              <span className="flex items-center gap-4">
                <ScanBarcode size={30} />
                {scannerNotice ??
                  (scanner.status === 'reading'
                    ? 'Leyendo…'
                    : 'Lector listo. Escanea el siguiente producto')}
              </span>
              <span className="rounded-full bg-white px-5 py-2">
                {session.totals.items_count === 1
                  ? '1 producto'
                  : `${session.totals.items_count} productos`}
              </span>
            </div>
            {empty ? (
              <Card className="py-16 text-center">
                <p className="text-2xl font-bold text-ink">
                  Tu carrito está vacío
                </p>
                <p className="mt-2 text-xl text-muted">
                  Escanea tu primer producto
                </p>
              </Card>
            ) : (
              session.items.map((item) => (
                <CartLine
                  key={`${item.id}-${item.is_new}`}
                  item={item}
                  disabled={busy}
                  onIncrease={() => {
                    if (item.quantity >= 99) {
                      setNotice('La cantidad máxima por línea es 99 unidades.')
                      return
                    }
                    updateMutation.mutate({
                      itemId: item.id,
                      quantity: item.quantity + 1,
                    })
                  }}
                  onDecrease={() =>
                    updateMutation.mutate({
                      itemId: item.id,
                      quantity: item.quantity - 1,
                    })
                  }
                  onRemove={() => removeMutation.mutate(item.id)}
                />
              ))
            )}
            {notice && (
              <p
                role="alert"
                className="rounded-card border-2 border-danger bg-danger/10 p-4 text-lg font-bold text-danger"
              >
                {notice}
              </p>
            )}
          </section>
          <aside className="grid content-start gap-5 self-start xl:sticky xl:top-5">
            <Card className="!bg-brand-700 !text-white">
              <p className="text-2xl">Total a pagar</p>
              <p className="mt-2 text-6xl font-black">
                {formatMoney(session.totals.total)}
              </p>
              <p className="mt-2 text-xl">IVA incluido</p>
            </Card>
            <Card className="flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center gap-7">
                <DonutProgress
                  percent={session.budget.used_percent}
                  level={session.budget.level}
                />
                <div>
                  <p className="text-xl text-muted">Presupuesto</p>
                  <p className="text-3xl font-black text-ink">
                    {session.budget.amount
                      ? formatMoney(session.budget.amount)
                      : 'Sin definir'}
                  </p>
                  {session.budget.remaining && (
                    <p className="text-lg font-bold text-ok">
                      Te quedan {formatMoney(session.budget.remaining)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                className="w-full border-2 border-brand-500 text-brand-700 shadow-none"
                onClick={() => setBudgetEditorOpen((open) => !open)}
                variant="secondary"
              >
                {budgetEditorOpen
                  ? 'Cerrar presupuesto'
                  : session.budget.amount
                    ? 'Cambiar presupuesto'
                    : 'Definir presupuesto'}
              </Button>
              {budgetEditorOpen && (
                <BudgetEditor
                  currentAmount={session.budget.amount}
                  onClear={() =>
                    budgetMutation.mutateAsync(null).then(() => undefined)
                  }
                  onSave={(amount) =>
                    budgetMutation.mutateAsync(amount).then(() => undefined)
                  }
                />
              )}
            </Card>
            <Button
              variant="secondary"
              className="border-2 border-brand-500 text-brand-700 shadow-none"
              onClick={() => navigate('/offers')}
            >
              <span className="flex items-center justify-center gap-3">
                <Tag size={28} />
                Ver ofertas
              </span>
            </Button>
            <Button disabled={empty} onClick={() => navigate('/checkout')}>
              <span className="flex items-center justify-center gap-3">
                Ir a pagar <TicketCheck size={28} />
              </span>
            </Button>
          </aside>
        </div>
      </CartLayout>
      {demoMode && (
        <DemoPanel
          onBudget={setDemoBudget}
          onReset={resetDemo}
          onScan={(barcode) =>
            scanMutation
              .mutateAsync({ barcode, source: 'simulation' })
              .then(() => undefined)
          }
        />
      )}
      {sessionQuery.data && (
        <BudgetAlertController
          key={`${sessionQuery.data.id}-${sessionQuery.data.budget.level}`}
          session={sessionQuery.data}
        />
      )}
    </>
  )
}

function CartLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto min-h-[calc(100vh-78px)] max-w-[1280px] bg-surface px-8 py-7">
        {children}
      </main>
    </>
  )
}
