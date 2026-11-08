import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import type { Session } from '../../api/types'
import { Button } from '../../components/Button'
import { DonutProgress, type BudgetLevel } from '../../components/DonutProgress'
import type { Budget } from '../../api/types'
import { formatMoney } from '../../lib/money'
import { evaluateBudgetAlert } from './budgetAlertState'

interface BudgetAlertProps {
  budget: Budget
  total: string
  onClose: () => void
}

function storageKey(sessionId: number) {
  return `smartcart.budget-alerts.${sessionId}`
}

function readRecord(sessionId: number) {
  try {
    return JSON.parse(
      sessionStorage.getItem(storageKey(sessionId)) ??
        '{"lastLevel":"none","acknowledged":[]}',
    ) as { lastLevel: BudgetLevel; acknowledged: BudgetLevel[] }
  } catch {
    return { lastLevel: 'none' as BudgetLevel, acknowledged: [] }
  }
}

export function BudgetAlertController({ session }: { session: Session }) {
  const [level, setLevel] = useState<BudgetLevel | null>(() => {
    const transition = evaluateBudgetAlert(
      session.budget.level,
      readRecord(session.id),
    )
    sessionStorage.setItem(
      storageKey(session.id),
      JSON.stringify(transition.record),
    )
    return transition.shouldShow ? session.budget.level : null
  })

  const close = () => {
    const record = readRecord(session.id)
    sessionStorage.setItem(
      storageKey(session.id),
      JSON.stringify({
        ...record,
        acknowledged: [...new Set([...record.acknowledged, level])],
      }),
    )
    setLevel(null)
  }

  if (!level) return null
  return (
    <BudgetAlert
      budget={session.budget}
      onClose={close}
      total={session.totals.total}
    />
  )
}

export function BudgetAlert({ budget, total, onClose }: BudgetAlertProps) {
  const exceeded = budget.level === 'exceeded'
  const over = Math.max(0, Number(budget.remaining ?? 0) * -1)

  return (
    <div
      aria-label="Alerta de presupuesto"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 top-[88px] z-30 grid place-items-center bg-ink/50 px-5 py-8 backdrop-blur-[3px]"
      role="alertdialog"
    >
      <section
        className={`relative grid w-full max-w-[880px] gap-8 rounded-card border-4 bg-white p-8 shadow-2xl lg:grid-cols-[240px_1fr] ${exceeded ? 'border-danger' : 'border-amber-500'}`}
      >
        <button
          aria-label="Cerrar alerta de presupuesto"
          className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-surface text-ink"
          onClick={onClose}
          type="button"
        >
          <X size={25} />
        </button>
        <div className="grid place-items-center">
          <DonutProgress
            level={budget.level}
            percent={budget.used_percent}
            size="large"
          />
        </div>
        <div className="flex flex-col justify-center">
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-xl font-bold ${exceeded ? 'bg-danger/10 text-danger' : 'bg-amber-500/20 text-amber-600'}`}
          >
            <Bell size={25} />
            {exceeded ? 'Presupuesto excedido' : 'Alerta de presupuesto'}
          </span>
          <h2 className="mt-5 text-4xl font-black leading-tight text-ink">
            {exceeded
              ? 'Superaste tu presupuesto'
              : `Ya usaste el ${budget.used_percent} % de tu presupuesto`}
          </h2>
          <p className="mt-3 text-2xl text-muted">
            {exceeded
              ? `Llevas ${formatMoney(total)} de ${formatMoney(budget.amount)}. Te pasaste por ${formatMoney(over)}.`
              : `Llevas ${formatMoney(total)} de ${formatMoney(budget.amount)}. Te quedan ${formatMoney(budget.remaining)}.`}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Button
              className={
                exceeded ? 'bg-danger shadow-[0_8px_0_var(--color-danger)]' : ''
              }
              onClick={onClose}
              variant={exceeded ? 'primary' : 'amber'}
            >
              Seguir comprando
            </Button>
            <Button
              className="border-2 border-brand-500 text-brand-700 shadow-none"
              onClick={onClose}
              variant="secondary"
            >
              Revisar lista
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
