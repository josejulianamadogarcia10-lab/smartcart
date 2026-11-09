import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInactivityGuard } from './useInactivityGuard'

describe('useInactivityGuard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('avisa a los tres minutos y devuelve al inicio a los cinco si el carrito está vacío', () => {
    const onReturn = vi.fn()
    const { result } = renderHook(() =>
      useInactivityGuard({ isEmpty: true, onReturn }),
    )

    act(() => vi.advanceTimersByTime(3 * 60 * 1000))
    expect(result.current.warningVisible).toBe(true)
    act(() => vi.advanceTimersByTime(2 * 60 * 1000))
    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('con productos solo avisa y nunca expulsa', () => {
    const onReturn = vi.fn()
    const { result } = renderHook(() =>
      useInactivityGuard({ isEmpty: false, onReturn }),
    )

    act(() => vi.advanceTimersByTime(5 * 60 * 1000))
    expect(result.current.warningVisible).toBe(true)
    expect(onReturn).not.toHaveBeenCalled()
  })

  it('reinicia el contador cuando hay actividad', () => {
    const onReturn = vi.fn()
    renderHook(() => useInactivityGuard({ isEmpty: true, onReturn }))

    act(() => vi.advanceTimersByTime(2 * 60 * 1000))
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })))
    act(() => vi.advanceTimersByTime(3 * 60 * 1000))
    expect(onReturn).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(2 * 60 * 1000))
    expect(onReturn).toHaveBeenCalledOnce()
  })
})
