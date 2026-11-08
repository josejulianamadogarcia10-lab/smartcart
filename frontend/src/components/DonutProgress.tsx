export type BudgetLevel = 'none' | 'ok' | 'warning' | 'exceeded'

const levelStyles: Record<BudgetLevel, { ring: string; text: string }> = {
  none: { ring: 'var(--color-muted)', text: 'text-muted' },
  ok: { ring: 'var(--color-brand-500)', text: 'text-brand-700' },
  warning: { ring: 'var(--color-amber-500)', text: 'text-amber-600' },
  exceeded: { ring: 'var(--color-danger)', text: 'text-danger' },
}

export function DonutProgress({
  percent,
  level = 'ok',
  size = 'normal',
}: {
  percent: number
  level?: BudgetLevel
  size?: 'normal' | 'large'
}) {
  const bounded = Math.max(0, Math.min(percent, 100))
  const colors = levelStyles[level]
  return (
    <div
      className={`grid ${size === 'large' ? 'size-56' : 'size-36'} place-items-center rounded-full`}
      style={{
        background: `conic-gradient(${colors.ring} ${bounded}%, var(--color-surface) 0)`,
      }}
      aria-label={`Presupuesto usado: ${bounded}%`}
      role="img"
    >
      <div
        className={`grid ${size === 'large' ? 'size-40' : 'size-24'} place-items-center rounded-full bg-white text-center leading-none`}
      >
        <span
          className={`${size === 'large' ? 'text-6xl' : 'text-3xl'} font-black ${colors.text}`}
        >
          {bounded}%
        </span>
        <span
          className={`${size === 'large' ? 'text-2xl' : 'text-lg'} text-muted`}
        >
          usado
        </span>
      </div>
    </div>
  )
}
