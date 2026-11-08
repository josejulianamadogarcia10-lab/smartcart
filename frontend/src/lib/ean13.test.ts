import { describe, expect, it } from 'vitest'
import { isValidEan13 } from './ean13'

const catalogBarcodes = [
  '7401000000015',
  '7401000000022',
  '7401000000039',
  '7401000000046',
  '7401000000053',
  '7401000000060',
  '7401000000077',
  '7401000000084',
  '7401000000091',
  '7401000000107',
  '7401000000114',
  '7401000000121',
  '7401000000138',
  '7401000000145',
  '7401000000152',
  '7401000000169',
  '7401000000176',
  '7401000000183',
  '7401000000190',
  '7401000000206',
]

describe('isValidEan13', () => {
  it('valida los 20 códigos del catálogo', () => {
    expect(catalogBarcodes.every(isValidEan13)).toBe(true)
  })

  it.each(['123456789012', '12345678901234', '74010000000A5', '7401000000016'])(
    'rechaza %s',
    (barcode) => {
      expect(isValidEan13(barcode)).toBe(false)
    },
  )
})
