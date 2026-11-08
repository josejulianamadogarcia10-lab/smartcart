import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('muestra la pantalla inicial de SmartCart', () => {
    render(<App />)

    expect(screen.getByText('SmartCart')).toBeInTheDocument()
    expect(screen.getByText('Carrito 07')).toBeInTheDocument()
    expect(screen.getByText('Lector conectado')).toBeInTheDocument()
  })
})
