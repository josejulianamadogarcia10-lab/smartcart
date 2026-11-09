import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, CreditCard, FileText, Store } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiRequestError, tokenStorage } from '../../api/client'
import type { Item, Order, SessionTotals } from '../../api/types'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TopBar } from '../../components/TopBar'
import { formatMoney } from '../../lib/money'
import { useDemoStore } from '../../state/demoStore'

interface SummaryResponse {
  items: Item[]
  totals: SessionTotals
}

interface CheckoutResponse {
  order: Order
}

export function CheckoutScreen() {
  const navigate = useNavigate()
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const forceCheck = useDemoStore((state) => state.forceCheck)
  const simulateFailure = useDemoStore((state) => state.simulateFailure)
  const [invoiceType, setInvoiceType] = useState<'CF' | 'NIT'>('CF')
  const [nit, setNit] = useState('')
  const [nitError, setNitError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const summaryQuery = useQuery({
    queryKey: ['shopping-summary'],
    queryFn: () => apiFetch<SummaryResponse>('/sessions/current/summary'),
    enabled: Boolean(tokenStorage.get()),
  })
  const checkoutMutation = useMutation({
    mutationFn: (paymentMethod: 'card' | 'fast_checkout') =>
      apiFetch<CheckoutResponse>('/sessions/current/checkout', {
        method: 'POST',
        body: JSON.stringify({
          invoice_type: invoiceType,
          ...(invoiceType === 'NIT' ? { nit } : {}),
          payment_method: paymentMethod,
          ...(demoMode && simulateFailure ? { simulate_failure: true } : {}),
          ...(demoMode && forceCheck ? { force_check: true } : {}),
        }),
      }),
    onSuccess: ({ order }) => navigate('/exit', { state: { order } }),
    onError: (error) => {
      if (error instanceof ApiRequestError && error.status === 422) {
        setNitError(invoiceType === 'NIT' ? error.message : null)
        setPaymentError(
          invoiceType === 'NIT'
            ? null
            : 'No pudimos procesar el pago. Puedes intentarlo de nuevo.',
        )
        return
      }
      setPaymentError('No pudimos conectar con el servidor. Intenta de nuevo.')
    },
  })

  if (
    summaryQuery.error instanceof ApiRequestError &&
    [401, 404].includes(summaryQuery.error.status)
  ) {
    tokenStorage.clear()
    navigate('/')
    return null
  }

  const submitPayment = (paymentMethod: 'card' | 'fast_checkout') => {
    setNitError(null)
    setPaymentError(null)
    checkoutMutation.mutate(paymentMethod)
  }

  return (
    <>
      <TopBar title="Resumen de compra" />
      <main className="mx-auto min-h-[calc(100vh-78px)] max-w-[1280px] bg-surface px-8 py-7">
        {summaryQuery.isLoading && <SummarySkeleton />}
        {summaryQuery.isError && (
          <Card className="p-10 text-center">
            <p className="text-xl font-bold text-danger">
              No pudimos cargar el resumen.
            </p>
            <Button
              className="mt-6"
              onClick={() => void summaryQuery.refetch()}
            >
              Reintentar
            </Button>
          </Card>
        )}
        {summaryQuery.data && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="flex min-h-[650px] flex-col p-7">
              <h1 className="text-3xl font-black text-ink">
                Tu compra, {summaryQuery.data.totals.items_count} productos
              </h1>
              <div className="mt-5 grid">
                {summaryQuery.data.items.map((item) => (
                  <div
                    className="flex items-center justify-between border-b border-brand-100 py-4 text-2xl text-ink"
                    key={item.id}
                  >
                    <span className="flex items-center gap-4">
                      <span className="text-4xl" aria-hidden="true">
                        {item.product.emoji}
                      </span>
                      {item.product.name}
                    </span>
                    <strong>{formatMoney(item.line_total)}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-auto grid gap-3 pt-8 text-2xl">
                <TotalRow
                  label="Subtotal"
                  value={summaryQuery.data.totals.subtotal}
                />
                <TotalRow
                  label="IVA incluido 12 %"
                  value={summaryQuery.data.totals.vat}
                />
                <div className="mt-4 flex items-center justify-between text-3xl font-black text-ink">
                  <span>Total a pagar</span>
                  <span className="text-6xl text-brand-700">
                    {formatMoney(summaryQuery.data.totals.total)}
                  </span>
                </div>
              </div>
            </Card>
            <div className="grid content-start gap-4">
              <Card className="flex items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <FileText className="text-brand-700" size={34} />
                  <div>
                    <p className="text-xl text-muted">Factura a nombre de</p>
                    <strong className="text-2xl text-ink">
                      {invoiceType === 'CF' ? 'Consumidor final' : 'NIT'}
                    </strong>
                  </div>
                </div>
                <Button
                  className="px-5 text-lg shadow-none"
                  onClick={() => {
                    setInvoiceType(invoiceType === 'CF' ? 'NIT' : 'CF')
                    setNitError(null)
                  }}
                >
                  {invoiceType === 'CF' ? 'Cambiar NIT' : 'Usar CF'}
                </Button>
              </Card>
              {invoiceType === 'NIT' && (
                <label
                  className="grid gap-2 text-xl font-bold text-ink"
                  htmlFor="nit"
                >
                  NIT
                  <input
                    aria-describedby={nitError ? 'nit-error' : undefined}
                    className="min-h-14 rounded-btn border-2 border-brand-400 bg-white px-5 text-xl"
                    id="nit"
                    onChange={(event) => setNit(event.target.value)}
                    placeholder="123456-0"
                    value={nit}
                  />
                  {nitError && (
                    <span className="text-lg text-danger" id="nit-error">
                      {nitError}
                    </span>
                  )}
                </label>
              )}
              {paymentError && (
                <p
                  className="rounded-card border-2 border-danger bg-white p-4 text-lg font-bold text-danger"
                  role="alert"
                >
                  {paymentError}
                </p>
              )}
              <Button
                className="flex min-h-[106px] items-center justify-start gap-4 rounded-card px-7 text-left"
                disabled={
                  checkoutMutation.isPending ||
                  summaryQuery.data.items.length === 0
                }
                onClick={() => submitPayment('card')}
              >
                <CreditCard size={38} />
                <span>
                  <strong className="block text-2xl">
                    {checkoutMutation.isPending
                      ? 'Procesando…'
                      : 'Pagar con tarjeta'}
                  </strong>
                  <span className="font-normal">
                    Acerca o inserta tu tarjeta
                  </span>
                </span>
              </Button>
              <Button
                className="flex min-h-[106px] items-center justify-start gap-4 rounded-card bg-blue-500 px-7 text-left shadow-[0_8px_0_var(--color-blue-700)]"
                disabled={
                  checkoutMutation.isPending ||
                  summaryQuery.data.items.length === 0
                }
                onClick={() => submitPayment('fast_checkout')}
                variant="blue"
              >
                <Store size={38} />
                <span>
                  <strong className="block text-2xl">
                    Pagar en caja rápida
                  </strong>
                  <span className="font-normal">
                    Un cajero te atiende sin fila
                  </span>
                </span>
              </Button>
              <Button
                className="mt-56 flex items-center justify-center gap-3 border-2 border-brand-500 text-brand-700 shadow-none"
                onClick={() => navigate('/cart')}
                variant="secondary"
              >
                <ArrowLeft size={28} /> Volver al carrito
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <strong className="text-ink">{formatMoney(value)}</strong>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div
      aria-label="Cargando resumen"
      className="h-[650px] animate-pulse rounded-card bg-brand-100"
    />
  )
}
