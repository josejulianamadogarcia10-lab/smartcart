import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'amber' | 'blue'
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-[0_8px_0_var(--color-brand-700)]',
  secondary: 'bg-white text-ink shadow-[0_8px_0_var(--color-muted)]',
  amber: 'bg-amber-500 text-white shadow-[0_8px_0_var(--color-amber-600)]',
  blue: 'bg-blue-500 text-white shadow-[0_8px_0_var(--color-blue-700)]',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant
}) {
  return (
    <button
      className={`min-h-14 rounded-btn px-6 text-xl font-bold transition-transform active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
