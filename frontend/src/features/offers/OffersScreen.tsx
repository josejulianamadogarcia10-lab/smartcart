import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, ApiRequestError, tokenStorage } from '../../api/client'
import type { Offer, Session } from '../../api/types'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { OfferCard } from '../../components/OfferCard'
import { TopBar } from '../../components/TopBar'

const sessionKey = ['shopping-session']
const offersKey = ['shopping-offers']

interface OffersResponse {
  offers: Offer[]
}

export function OffersScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState<string | null>(null)
  const sessionQuery = useQuery({
    queryKey: sessionKey,
    queryFn: () => apiFetch<Session>('/sessions/current'),
    enabled: Boolean(tokenStorage.get()),
  })
  const offersQuery = useQuery({
    queryKey: offersKey,
    queryFn: () => apiFetch<OffersResponse>('/sessions/current/offers'),
    enabled: Boolean(tokenStorage.get()),
  })

  const addMutation = useMutation({
    mutationFn: (promotionId: number) =>
      apiFetch<Session>(`/sessions/current/offers/${promotionId}/add`, {
        method: 'POST',
      }),
    onSuccess: (session, promotionId) => {
      queryClient.setQueryData(sessionKey, session)
      queryClient.setQueryData<OffersResponse>(offersKey, (current) =>
        current
          ? {
              offers: current.offers.filter(
                (offer) => offer.id !== promotionId,
              ),
            }
          : current,
      )
      setNotice('Oferta agregada a tu carrito.')
    },
    onError: async (error) => {
      if (
        error instanceof ApiRequestError &&
        [404, 422].includes(error.status)
      ) {
        setNotice(
          error.status === 404
            ? 'Esta oferta ya no está disponible.'
            : 'Este producto ya está en tu carrito.',
        )
        await offersQuery.refetch()
        return
      }
      setNotice('No pudimos agregar la oferta. Intenta de nuevo.')
    },
  })

  if (
    [sessionQuery.error, offersQuery.error].some(
      (error) =>
        error instanceof ApiRequestError && [401, 404].includes(error.status),
    )
  ) {
    tokenStorage.clear()
    navigate('/')
    return null
  }

  const retry = () => {
    void sessionQuery.refetch()
    void offersQuery.refetch()
  }

  return (
    <>
      <TopBar title="Ofertas para ti" />
      <main className="mx-auto min-h-[calc(100vh-78px)] max-w-[1280px] bg-surface px-8 py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button
            className="flex items-center gap-3 border-2 border-brand-500 text-brand-700 shadow-none"
            onClick={() => navigate('/cart')}
            variant="secondary"
          >
            <ArrowLeft size={28} aria-hidden="true" /> Volver al carrito
          </Button>
          <div className="rounded-card bg-white px-6 py-3 text-2xl font-black text-ink shadow-md">
            Total actual: Q{sessionQuery.data?.totals.total ?? '0.00'}
          </div>
        </div>
        <p className="mb-5 text-2xl text-muted">
          Combinan con lo que llevas en tu carrito
        </p>

        {notice && (
          <div
            className="mb-5 flex items-center justify-between gap-4 rounded-card border-2 border-brand-500 bg-white p-4 text-lg font-bold text-brand-800"
            role="status"
          >
            <span>{notice}</span>
            <button
              className="underline"
              onClick={() => setNotice(null)}
              type="button"
            >
              Cerrar
            </button>
          </div>
        )}

        {(sessionQuery.isLoading || offersQuery.isLoading) && (
          <OffersSkeleton />
        )}
        {(sessionQuery.isError || offersQuery.isError) && (
          <Card className="p-10 text-center">
            <p className="text-xl font-bold text-danger">
              No pudimos cargar las ofertas.
            </p>
            <Button className="mt-6" onClick={retry}>
              Reintentar
            </Button>
          </Card>
        )}
        {!sessionQuery.isLoading &&
          !offersQuery.isLoading &&
          offersQuery.data?.offers.length === 0 && (
            <Card className="p-10 text-center">
              <Tag className="mx-auto text-brand-700" size={48} />
              <p className="mt-4 text-2xl font-bold text-ink">
                No hay ofertas disponibles por ahora.
              </p>
            </Card>
          )}
        {offersQuery.data && offersQuery.data.offers.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-3">
            {offersQuery.data.offers.slice(0, 3).map((offer, index) => (
              <OfferCard
                disabled={addMutation.isPending}
                index={index}
                key={offer.id}
                offer={offer}
                onAdd={() => addMutation.mutate(offer.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function OffersSkeleton() {
  return (
    <div aria-label="Cargando ofertas" className="grid gap-5 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          className="h-[590px] animate-pulse rounded-card bg-brand-100"
          key={item}
        />
      ))}
    </div>
  )
}
