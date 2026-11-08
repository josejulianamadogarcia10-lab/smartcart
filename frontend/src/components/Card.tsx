import type { PropsWithChildren } from 'react'

export function Card({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={`rounded-card bg-white p-6 shadow-xl shadow-brand-100/70 ${className}`}
    >
      {children}
    </section>
  )
}
