import { CheckCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Order } from '../../api/types'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TopBar } from '../../components/TopBar'

export function ExitScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const order = (location.state as { order?: Order } | null)?.order

  return (
    <>
      <TopBar title="Compra finalizada" />
      <main className="mx-auto flex min-h-[calc(100vh-78px)] max-w-3xl items-center justify-center bg-surface px-8 py-7">
        <Card className="w-full p-10 text-center">
          <CheckCircle className="mx-auto text-ok" size={72} />
          <h1 className="mt-5 text-4xl font-black text-ink">
            ¡Gracias por tu compra!
          </h1>
          {order ? (
            <p className="mt-5 text-2xl text-muted">
              Código de salida:{' '}
              <strong className="text-4xl text-brand-700">
                {order.exit_code}
              </strong>
            </p>
          ) : (
            <p className="mt-5 text-xl text-muted">
              No encontramos el código de salida de esta compra.
            </p>
          )}
          <Button className="mt-8" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </Card>
      </main>
    </>
  )
}
