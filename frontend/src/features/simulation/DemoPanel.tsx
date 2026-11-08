import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { demoCatalog, scenarioBarcodes } from '../../state/demoCatalog'
import { useDemoStore } from '../../state/demoStore'

interface DemoPanelProps {
  onScan: (barcode: string) => Promise<void>
  onBudget: () => Promise<void>
  onReset: () => Promise<void>
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

export function DemoPanel({ onBudget, onScan, onReset }: DemoPanelProps) {
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const panelOpen = useDemoStore((state) => state.panelOpen)
  const forceCheck = useDemoStore((state) => state.forceCheck)
  const simulateFailure = useDemoStore((state) => state.simulateFailure)
  const scenarioRunning = useDemoStore((state) => state.scenarioRunning)
  const togglePanel = useDemoStore((state) => state.togglePanel)
  const closePanel = useDemoStore((state) => state.closePanel)
  const toggleForceCheck = useDemoStore((state) => state.toggleForceCheck)
  const toggleSimulateFailure = useDemoStore(
    (state) => state.toggleSimulateFailure,
  )
  const startScenario = useDemoStore((state) => state.startScenario)
  const finishScenario = useDemoStore((state) => state.finishScenario)
  const resetDemo = useDemoStore((state) => state.resetDemo)

  if (!panelOpen) {
    return (
      <button
        aria-label="Abrir panel de simulación"
        className="fixed bottom-4 right-4 z-20 min-h-14 rounded-full bg-brand-700 px-5 text-lg font-bold text-white shadow-lg"
        onClick={togglePanel}
        type="button"
      >
        Simulación
      </button>
    )
  }

  const runScenario = async () => {
    setError(null)
    startScenario()
    closePanel()
    const version = useDemoStore.getState().scenarioVersion
    try {
      for (const scenarioBarcode of scenarioBarcodes) {
        const current = useDemoStore.getState()
        if (current.scenarioVersion !== version) return
        await onScan(scenarioBarcode)
        await wait(1200)
      }
    } catch {
      setError('No pudimos completar el escenario.')
    } finally {
      finishScenario()
    }
  }

  const submitBarcode = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!barcode || scenarioRunning) return
    setError(null)
    try {
      await onScan(barcode)
      setBarcode('')
    } catch {
      setError('No pudimos escanear ese código.')
    }
  }

  const reset = async () => {
    setError(null)
    try {
      await onReset()
      resetDemo()
    } catch {
      setError('No pudimos reiniciar la demo.')
    }
  }

  const setBudget = async () => {
    setError(null)
    try {
      await onBudget()
    } catch {
      setError('No pudimos definir el presupuesto.')
    }
  }

  return (
    <Card className="fixed inset-y-4 right-4 z-20 flex w-[min(440px,calc(100vw-2rem))] flex-col overflow-y-auto border-2 border-brand-500 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-black text-ink">Panel de simulación</p>
          <p className="text-base text-muted">Solo visible en modo demo</p>
        </div>
        <button
          aria-label="Cerrar panel de simulación"
          className="grid size-12 place-items-center rounded-btn bg-surface text-ink"
          onClick={closePanel}
          type="button"
        >
          <X size={25} />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Button disabled={scenarioRunning} onClick={() => void runScenario()}>
          {scenarioRunning ? 'Escenario en curso…' : 'Escenario completo'}
        </Button>
        <Button disabled={scenarioRunning} onClick={() => void setBudget()}>
          Definir presupuesto Q100
        </Button>
        <Button
          disabled={scenarioRunning}
          onClick={() => void reset()}
          variant="secondary"
        >
          <span className="flex items-center justify-center gap-2">
            <RotateCcw size={23} />
            Reiniciar demo
          </span>
        </Button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-14 items-center justify-between gap-3 rounded-btn bg-surface px-4 text-lg font-bold text-ink">
          Forzar revisión
          <input
            aria-label="Forzar revisión"
            checked={forceCheck}
            className="size-6 accent-brand-700"
            onChange={toggleForceCheck}
            type="checkbox"
          />
        </label>
        <label className="flex min-h-14 items-center justify-between gap-3 rounded-btn bg-surface px-4 text-lg font-bold text-ink">
          Forzar fallo de pago
          <input
            aria-label="Forzar fallo de pago"
            checked={simulateFailure}
            className="size-6 accent-brand-700"
            onChange={toggleSimulateFailure}
            type="checkbox"
          />
        </label>
      </div>

      <form
        className="mt-3 grid gap-3"
        onSubmit={(event) => void submitBarcode(event)}
      >
        <label className="text-lg font-bold text-ink" htmlFor="demo-barcode">
          Probar un código
        </label>
        <div className="flex gap-3">
          <input
            className="min-h-14 min-w-0 flex-1 rounded-btn border-2 border-brand-100 px-4 text-lg text-ink"
            id="demo-barcode"
            inputMode="numeric"
            onChange={(event) => setBarcode(event.target.value)}
            placeholder="EAN-13"
            value={barcode}
          />
          <Button disabled={scenarioRunning || !barcode} type="submit">
            Escanear
          </Button>
        </div>
      </form>

      <p className="mt-5 text-lg font-bold text-ink">Productos demo</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {demoCatalog.map((product) => (
          <button
            className="flex min-h-14 items-center gap-2 rounded-btn border-2 border-brand-100 bg-white px-3 text-left text-base font-bold text-ink disabled:opacity-50"
            disabled={scenarioRunning}
            key={product.barcode}
            onClick={() => void onScan(product.barcode)}
            type="button"
          >
            <span aria-hidden="true" className="text-2xl">
              {product.emoji}
            </span>
            <span className="min-w-0 whitespace-normal break-words leading-snug">
              {product.name}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-lg font-bold text-danger">{error}</p>}
    </Card>
  )
}
