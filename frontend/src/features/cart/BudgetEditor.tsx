import { useState } from 'react'
import { Button } from '../../components/Button'

interface BudgetEditorProps {
  currentAmount: string | null
  onSave: (amount: string) => Promise<void>
  onClear: () => Promise<void>
}

export function BudgetEditor({
  currentAmount,
  onClear,
  onSave,
}: BudgetEditorProps) {
  const [amount, setAmount] = useState(currentAmount ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = async (value: string) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('El presupuesto debe ser mayor que Q0.00.')
      return
    }
    setError(null)
    try {
      await onSave(numeric.toFixed(2))
    } catch {
      setError('No pudimos guardar el presupuesto.')
    }
  }

  return (
    <div className="mt-4 grid gap-3 rounded-card bg-surface p-4">
      <p className="text-lg font-bold text-ink">Define tu presupuesto</p>
      <div className="grid grid-cols-3 gap-2">
        {[100, 200, 300].map((value) => (
          <Button
            className="px-2 text-lg"
            key={value}
            onClick={() => void save(String(value))}
          >
            Q{value}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          aria-label="Otro presupuesto"
          className="min-h-14 min-w-0 flex-1 rounded-btn border-2 border-brand-100 bg-white px-4 text-lg text-ink"
          inputMode="decimal"
          min="0.01"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Otro monto"
          step="0.01"
          type="number"
          value={amount}
        />
        <Button onClick={() => void save(amount)}>Guardar</Button>
      </div>
      {currentAmount && (
        <Button
          className="text-danger shadow-none"
          onClick={() =>
            void onClear().catch(() =>
              setError('No pudimos quitar el presupuesto.'),
            )
          }
          variant="secondary"
        >
          Quitar presupuesto
        </Button>
      )}
      {error && <p className="text-lg font-bold text-danger">{error}</p>}
    </div>
  )
}
