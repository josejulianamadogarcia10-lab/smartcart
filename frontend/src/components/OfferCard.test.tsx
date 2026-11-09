import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Offer } from '../api/types'
import { OfferCard } from './OfferCard'

const twoForOne: Offer = {
  id: 7,
  name: 'Jugo de naranja',
  emoji: '🧃',
  category: 'Bebidas',
  original_price: '15.00',
  promo_price: '15.00',
  saving: '0.00',
  label: '2x1 en la segunda unidad',
}

it('muestra 2x1 sin ahorro ni precio tachado cuando no hay descuento', () => {
  render(<OfferCard index={0} offer={twoForOne} onAdd={() => undefined} />)

  expect(screen.getByText('2x1')).toBeInTheDocument()
  expect(screen.queryByText('Ahorras Q0.00')).not.toBeInTheDocument()
  expect(
    screen.queryByText('Q15.00', { selector: 'span.line-through' }),
  ).not.toBeInTheDocument()
})
