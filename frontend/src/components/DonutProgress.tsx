export function DonutProgress({ percent }: { percent: number }) {
  const bounded = Math.max(0, Math.min(percent, 100))
  return (
    <div
      className="grid size-36 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-brand-500) ${bounded}%, var(--color-brand-100) 0)`,
      }}
      aria-label={`Presupuesto usado: ${bounded}%`}
      role="img"
    >
      <div className="grid size-24 place-items-center rounded-full bg-white text-center">
        <span className="text-2xl font-black text-brand-700">{bounded}%</span>
      </div>
    </div>
  )
}
