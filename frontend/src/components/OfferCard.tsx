import { MapPin, Plus } from 'lucide-react'
import type { Offer } from '../api/types'
import { Button } from './Button'
import { Card } from './Card'

const imageBackgrounds = ['bg-amber-100', 'bg-yellow-100', 'bg-orange-100']

export function OfferCard({
  offer,
  index,
  onAdd,
  disabled = false,
}: {
  offer: Offer
  index: number
  onAdd: () => void
  disabled?: boolean
}) {
  return (
    <Card className="flex h-full flex-col gap-3 p-[22px]">
      <div
        className={`relative grid h-[200px] place-items-center rounded-card text-[110px] ${imageBackgrounds[index % imageBackgrounds.length]}`}
      >
        <span aria-hidden="true">{offer.emoji}</span>
        <span className="absolute left-3 top-3 rounded-full bg-amber-500/15 px-4 py-2 text-lg font-bold text-amber-600">
          Ahorras Q{offer.saving}
        </span>
      </div>
      <h2 className="text-3xl font-black text-ink">{offer.name}</h2>
      <p className="text-xl text-muted">{offer.label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-5xl font-black text-amber-600">
          Q{offer.promo_price}
        </span>
        <span className="text-2xl text-muted line-through">
          Q{offer.original_price}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-lg font-bold text-ink">
          <MapPin size={24} aria-hidden="true" /> Pasillo 4
        </span>
        <span className="rounded-full bg-brand-100 px-4 py-2 text-lg font-bold text-brand-800">
          {offer.category}
        </span>
      </div>
      <Button
        className="mt-auto flex w-full items-center justify-center gap-3"
        disabled={disabled}
        onClick={onAdd}
      >
        <Plus size={30} aria-hidden="true" /> Agregar
      </Button>
    </Card>
  )
}
