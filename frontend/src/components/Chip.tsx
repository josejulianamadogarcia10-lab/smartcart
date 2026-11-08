import type { PropsWithChildren } from 'react'

export function Chip({ children }: PropsWithChildren) {
  return (
    <span className="rounded-full bg-brand-100 px-4 py-2 text-lg font-bold text-brand-800">
      {children}
    </span>
  )
}
