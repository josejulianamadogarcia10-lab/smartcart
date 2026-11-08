export type UserRole = 'customer' | 'guest' | 'admin'

export interface User {
  id: number
  name: string
  email: string | null
  role: UserRole
  qr_code?: string | null
  nit?: string | null
}

export interface Item {
  id: number
  product: { name: string; category: string; emoji: string }
  quantity: number
  unit_price: string
  line_total: string
  promo_applied: boolean
  is_new: boolean
}

export interface Budget {
  amount: string | null
  used_percent: number
  remaining: string | null
  level: 'none' | 'ok' | 'warning' | 'exceeded'
}

export interface SessionTotals {
  items_count: number
  subtotal: string
  vat: string
  total: string
}

export interface Session {
  id: number
  status: 'active' | 'checkout' | 'paid' | 'cancelled'
  items: Item[]
  totals: SessionTotals
  budget: Budget
}

export interface Offer {
  id: number
  name: string
  emoji: string
  category: string
  original_price: string
  promo_price: string
  saving: string
  label: string
}

export interface Order {
  id: number
  shopping_session_id: number
  invoice_type: 'CF' | 'NIT'
  nit: string | null
  subtotal: string
  vat: string
  total: string
  payment_method: 'card' | 'fast_checkout'
  status: 'paid' | 'pending_cashier' | 'failed'
  requires_check: boolean
  exit_code: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
