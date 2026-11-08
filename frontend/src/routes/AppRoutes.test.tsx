import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { tokenStorage } from '../api/client'
import { AppRoutes } from './AppRoutes'

describe('AppRoutes', () => {
  beforeEach(() => tokenStorage.clear())

  it('redirige una ruta protegida al inicio sin token', () => {
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Bienvenido a SmartCart' }),
    ).toBeInTheDocument()
  })
})
