import { describe, expect, it } from 'vitest'
import {
  demoCatalog,
  demoCatalogHasValidEan13,
  scenarioBarcodes,
} from './demoCatalog'

describe('demoCatalog', () => {
  it('contiene 20 productos con EAN-13 válidos', () => {
    expect(demoCatalog).toHaveLength(20)
    expect(demoCatalogHasValidEan13).toBe(true)
  })

  it('usa los cuatro productos definidos para el escenario completo', () => {
    expect(scenarioBarcodes).toEqual([
      '7401000000015',
      '7401000000046',
      '7401000000060',
      '7401000000107',
    ])
  })
})
