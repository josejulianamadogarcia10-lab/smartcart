import { useQuery } from '@tanstack/react-query'
import { CheckCircle, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch, ApiRequestError, tokenStorage } from '../../api/client'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TopBar } from '../../components/TopBar'

interface ExitResponse {
  exit_code: string
  requires_check: boolean
}

export function ExitScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const orderId = (location.state as { orderId?: number } | null)?.orderId
  const exitQuery = useQuery({
    queryKey: ['order-exit', orderId],
    queryFn: () => apiFetch<ExitResponse>(`/orders/${orderId}/exit`),
    enabled: Boolean(orderId && tokenStorage.get()),
  })

  if (
    exitQuery.error instanceof ApiRequestError &&
    [401, 403, 404].includes(exitQuery.error.status)
  ) {
    tokenStorage.clear()
    navigate('/')
    return null
  }

  return (
    <>
      <TopBar title="Compra finalizada" user="Pago aprobado" />
      <main className="mx-auto min-h-[calc(100vh-78px)] max-w-[1280px] bg-surface px-8 py-7">
        {!orderId ? (
          <Card className="mx-auto mt-24 max-w-2xl p-10 text-center">
            <p className="text-2xl font-bold text-danger">
              No encontramos el código de salida de esta compra.
            </p>
            <Button className="mt-8" onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </Card>
        ) : exitQuery.isLoading ? (
          <div
            aria-label="Cargando salida"
            className="h-[650px] animate-pulse rounded-card bg-brand-100"
          />
        ) : exitQuery.isError || !exitQuery.data ? (
          <Card className="mx-auto mt-24 max-w-2xl p-10 text-center">
            <p className="text-2xl font-bold text-danger">
              No pudimos cargar el código de salida.
            </p>
            <Button className="mt-8" onClick={() => void exitQuery.refetch()}>
              Reintentar
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
            <Card className="flex min-h-[650px] flex-col justify-center bg-gradient-to-br from-white to-brand-100 p-10">
              <CheckCircle className="text-ok" size={88} />
              <h1 className="mt-8 text-6xl font-black text-ink">
                ¡Gracias por tu compra!
              </h1>
              <p className="mt-5 text-2xl text-muted">
                Tu compra fue registrada correctamente.
              </p>
              {exitQuery.data.requires_check && (
                <div className="mt-8 flex items-start gap-4 rounded-card border-2 border-amber-500 bg-white p-6 text-2xl font-bold text-ink">
                  <ShieldCheck className="shrink-0 text-amber-600" size={36} />
                  <span>
                    El personal hará una revisión aleatoria de tu carrito.
                  </span>
                </div>
              )}
            </Card>
            <Card className="flex min-h-[650px] flex-col items-center justify-center p-8 text-center">
              <h2 className="text-3xl font-black text-ink">Código de salida</h2>
              <div className="mt-5 rounded-card border-4 border-surface bg-white p-3">
                <QRCodeSVG
                  aria-label="Código QR de salida"
                  value={exitQuery.data.exit_code}
                  size={230}
                  fgColor="var(--color-ink)"
                />
              </div>
              <span className="mt-5 rounded-full bg-brand-100 px-6 py-3 text-3xl font-black text-brand-700">
                {exitQuery.data.exit_code}
              </span>
              <p className="mt-5 text-xl text-muted">
                Muéstralo al personal en la puerta.
              </p>
            </Card>
          </div>
        )}
      </main>
    </>
  )
}
