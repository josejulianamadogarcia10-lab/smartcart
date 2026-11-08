import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { Budget } from '../../api/types'
import { BudgetAlert } from './BudgetAlert'

const warningBudget: Budget = {
  amount: '100.00',
  used_percent: 85,
  remaining: '14.75',
  level: 'warning',
}

it('muestra la alerta warning con valores del servidor y permite cerrarla', () => {
  const onClose = vi.fn()
  render(<BudgetAlert budget={warningBudget} onClose={onClose} total="85.25" />)

  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  expect(screen.getByText('Alerta de presupuesto')).toBeInTheDocument()
  expect(
    screen.getByText('Ya usaste el 85 % de tu presupuesto'),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Llevas Q85.25 de Q100.00. Te quedan Q14.75.'),
  ).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Seguir comprando' }))
  expect(onClose).toHaveBeenCalledOnce()
})

it('muestra el formato rojo para presupuesto excedido', () => {
  const budget: Budget = {
    amount: '100.00',
    used_percent: 120,
    remaining: '-20.00',
    level: 'exceeded',
  }
  render(<BudgetAlert budget={budget} onClose={vi.fn()} total="120.00" />)

  expect(screen.getByText('Superaste tu presupuesto')).toBeInTheDocument()
  expect(
    screen.getByText('Llevas Q120.00 de Q100.00. Te pasaste por Q20.00.'),
  ).toBeInTheDocument()
  expect(screen.getByRole('alertdialog')).toHaveClass('bg-ink/50')
})
