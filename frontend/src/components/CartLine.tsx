import { useEffect, useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { Item } from '../api/types'
import { formatMoney } from '../lib/money'

const categoryStyles: Record<string, string> = {
  Lácteos: 'bg-blue-500/20 text-blue-700',
  Panadería: 'bg-amber-500/20 text-amber-600',
  Bebidas: 'bg-danger/15 text-danger',
  Frescos: 'bg-ok/15 text-ok',
}

interface CartLineProps {
  item: Item
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
  disabled?: boolean
}

export function CartLine({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  disabled = false,
}: CartLineProps) {
  const [showNew, setShowNew] = useState(item.is_new)
  const categoryStyle =
    categoryStyles[item.product.category] ?? 'bg-brand-100 text-brand-700'

  useEffect(() => {
    if (!item.is_new) return
    const timeout = window.setTimeout(() => setShowNew(false), 4000)
    return () => window.clearTimeout(timeout)
  }, [item.is_new])

  return (
    <article
      className={`relative flex min-h-[120px] items-center gap-5 rounded-card bg-white px-6 py-4 shadow-lg shadow-brand-100/70 ${showNew ? 'border-2 border-ok bg-ok/5' : ''}`}
    >
      <div
        className={`grid size-[84px] shrink-0 place-items-center rounded-card text-5xl ${categoryStyle}`}
        aria-hidden="true"
      >
        {item.product.emoji}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p className="text-[28px] font-black leading-tight text-ink">
          {item.product.name}
        </p>
        {showNew && (
          <span className="mt-1 inline-block rounded-full bg-ok/15 px-3 py-1 text-base font-bold text-ok">
            Recién escaneado
          </span>
        )}
        <div className="mt-1 flex items-center gap-2 text-lg">
          <span className={`rounded-full px-3 py-1 font-bold ${categoryStyle}`}>
            {item.product.category}
          </span>
          <span className="text-muted">{formatMoney(item.unit_price)} c/u</span>
        </div>
      </div>
      <div className="flex h-14 shrink-0 items-center gap-1 rounded-card bg-surface p-1">
        <button
          className="grid size-12 place-items-center rounded-btn bg-white text-brand-700 shadow-sm disabled:opacity-40"
          aria-label="Disminuir cantidad"
          disabled={disabled || item.quantity <= 1}
          onClick={onDecrease}
        >
          <Minus size={25} strokeWidth={3} />
        </button>
        <span className="grid min-w-12 place-items-center text-2xl font-black text-ink">
          {item.quantity}
        </span>
        <button
          className="grid size-12 place-items-center rounded-btn bg-white text-brand-700 shadow-sm disabled:opacity-40"
          aria-label="Aumentar cantidad"
          disabled={disabled}
          onClick={onIncrease}
        >
          <Plus size={25} strokeWidth={3} />
        </button>
      </div>
      <strong className="w-28 shrink-0 text-right text-2xl font-black text-ink">
        {formatMoney(item.line_total)}
      </strong>
      <button
        className="grid size-[54px] shrink-0 place-items-center rounded-card bg-danger/10 text-danger disabled:opacity-40"
        aria-label="Eliminar producto"
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 size={27} strokeWidth={2.5} />
      </button>
    </article>
  )
}
