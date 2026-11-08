import { Minus, Plus, Trash2 } from 'lucide-react'
import type { Item } from '../api/types'

export function CartLine({ item }: { item: Item }) {
  return (
    <article className="flex items-center gap-4 rounded-card bg-white p-5 shadow-lg shadow-brand-100/70">
      <span className="text-5xl" aria-hidden="true">
        {item.product.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-black text-ink">{item.product.name}</p>
        <p className="text-lg text-muted">
          {item.product.category} · Q{item.unit_price}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-btn bg-surface p-2">
        <button
          className="rounded-full p-2 text-ink"
          aria-label="Disminuir cantidad"
        >
          <Minus size={20} />
        </button>
        <span className="min-w-8 text-center text-xl font-bold">
          {item.quantity}
        </span>
        <button
          className="rounded-full p-2 text-ink"
          aria-label="Aumentar cantidad"
        >
          <Plus size={20} />
        </button>
      </div>
      <strong className="text-xl text-ink">Q{item.line_total}</strong>
      <button
        className="rounded-full p-3 text-danger"
        aria-label="Eliminar producto"
      >
        <Trash2 size={22} />
      </button>
    </article>
  )
}
