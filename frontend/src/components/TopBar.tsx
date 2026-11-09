import { Bluetooth, ShoppingCart } from 'lucide-react'
import { Chip } from './Chip'

export function TopBar({
  user = 'Invitado',
  title,
}: {
  user?: string
  title?: string
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <ShoppingCart className="text-brand-700" size={32} aria-hidden="true" />
        <span className="text-2xl font-black text-ink">SmartCart</span>
        {title && <span className="text-2xl font-bold text-ink">{title}</span>}
        <Chip>Carrito 07</Chip>
      </div>
      <div className="flex items-center gap-5 text-lg font-bold">
        <span className="flex items-center gap-2 text-ok">
          <Bluetooth size={22} aria-hidden="true" /> Lector conectado
        </span>
        <span className="text-ink">{user}</span>
      </div>
    </header>
  )
}
