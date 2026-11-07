import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('muestra la pantalla inicial de SmartCart', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'SmartCart' }),
    ).toBeInTheDocument()
    expect(screen.getByText('React 19')).toBeInTheDocument()
  })
})
