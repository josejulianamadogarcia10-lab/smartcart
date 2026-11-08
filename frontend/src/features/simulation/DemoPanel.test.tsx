import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoPanel } from './DemoPanel'
import { useDemoStore } from '../../state/demoStore'

describe('DemoPanel', () => {
  beforeEach(() => {
    useDemoStore.setState({
      panelOpen: true,
      forceCheck: false,
      simulateFailure: false,
      scenarioRunning: false,
      scenarioVersion: 0,
    })
  })

  it('muestra los 20 productos y conserva las banderas de checkout', () => {
    render(
      <DemoPanel
        onBudget={vi.fn().mockResolvedValue(undefined)}
        onScan={vi.fn()}
        onReset={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(25)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Forzar revisión' }))
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Forzar fallo de pago' }),
    )

    expect(useDemoStore.getState().forceCheck).toBe(true)
    expect(useDemoStore.getState().simulateFailure).toBe(true)
  })

  it('permite escanear un código desde el formulario demo', async () => {
    const onScan = vi.fn().mockResolvedValue(undefined)
    render(
      <DemoPanel
        onBudget={vi.fn().mockResolvedValue(undefined)}
        onScan={onScan}
        onReset={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Probar un código'), {
      target: { value: '7401000000015' },
    })
    fireEvent.submit(screen.getByRole('textbox'))

    expect(onScan).toHaveBeenCalledWith('7401000000015')
  })
})
