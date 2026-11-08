import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBarcodeScanner } from './useBarcodeScanner'

function ScannerHarness({
  onScan,
  onInvalid,
}: {
  onScan: (barcode: string) => void
  onInvalid: () => void
}) {
  const { status } = useBarcodeScanner({ onScan, onInvalid })
  return (
    <>
      <span data-testid="status">{status}</span>
      <input aria-label="NIT" />
    </>
  )
}

function typeBarcode(barcode: string, interval = 10) {
  for (const character of barcode) {
    fireEvent.keyDown(window, { key: character })
    vi.advanceTimersByTime(interval)
  }
}

describe('useBarcodeScanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('envía un EAN válido terminado con Enter', () => {
    const onScan = vi.fn()
    render(<ScannerHarness onScan={onScan} onInvalid={vi.fn()} />)

    typeBarcode('7401000000015')
    fireEvent.keyDown(window, { key: 'Enter' })

    expect(onScan).toHaveBeenCalledWith('7401000000015')
    expect(screen.getByTestId('status')).toHaveTextContent('ready')
  })

  it('acepta Tab, rechaza teclas lentas e ignora edición de texto', () => {
    const onScan = vi.fn()
    const onInvalid = vi.fn()
    render(<ScannerHarness onScan={onScan} onInvalid={onInvalid} />)

    typeBarcode('7401000', 60)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onInvalid).toHaveBeenCalledOnce()

    typeBarcode('7401000000015')
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(onScan).toHaveBeenCalledOnce()

    const input = screen.getByRole('textbox')
    input.focus()
    for (const character of '7401000000015')
      fireEvent.keyDown(input, { key: character })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onScan).toHaveBeenCalledOnce()
  })

  it('ignora el mismo código dentro de 300 ms y permite atajos', () => {
    const onScan = vi.fn()
    const onInvalid = vi.fn()
    render(<ScannerHarness onScan={onScan} onInvalid={onInvalid} />)

    typeBarcode('7401000000015')
    fireEvent.keyDown(window, { key: 'Enter' })
    typeBarcode('7401000000015')
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onScan).toHaveBeenCalledOnce()

    const invalidBeforeShortcut = onInvalid.mock.calls.length
    fireEvent.keyDown(window, { key: 'd', ctrlKey: true })
    expect(onInvalid).toHaveBeenCalledTimes(invalidBeforeShortcut)
  })
})
