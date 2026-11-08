import { describe, expect, it } from 'vitest'
import { evaluateBudgetAlert } from './budgetAlertState'

describe('evaluateBudgetAlert', () => {
  it('muestra warning y exceeded una sola vez por ascenso', () => {
    const firstWarning = evaluateBudgetAlert('warning', {
      lastLevel: 'ok',
      acknowledged: [],
    })
    expect(firstWarning.shouldShow).toBe(true)

    const acknowledgedWarning = evaluateBudgetAlert('warning', {
      ...firstWarning.record,
      acknowledged: ['warning'],
    })
    expect(acknowledgedWarning.shouldShow).toBe(false)

    const exceeded = evaluateBudgetAlert('exceeded', {
      ...acknowledgedWarning.record,
    })
    expect(exceeded.shouldShow).toBe(true)
  })

  it('borra las alertas al bajar y permite volver a cruzar warning', () => {
    const lowered = evaluateBudgetAlert('ok', {
      lastLevel: 'warning',
      acknowledged: ['warning', 'exceeded'],
    })
    expect(lowered.record.acknowledged).toEqual([])

    const raisedAgain = evaluateBudgetAlert('warning', lowered.record)
    expect(raisedAgain.shouldShow).toBe(true)
  })
})
