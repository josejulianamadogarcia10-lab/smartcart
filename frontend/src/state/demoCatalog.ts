import { isValidEan13 } from '../lib/ean13'

export interface DemoCatalogProduct {
  barcode: string
  name: string
  category: string
  emoji: string
}

export const demoCatalog: DemoCatalogProduct[] = [
  {
    barcode: '7401000000015',
    name: 'Leche entera 1 litro',
    category: 'Lácteos',
    emoji: '🥛',
  },
  {
    barcode: '7401000000022',
    name: 'Queso fresco 400 g',
    category: 'Lácteos',
    emoji: '🧀',
  },
  {
    barcode: '7401000000039',
    name: 'Mantequilla 250 g',
    category: 'Lácteos',
    emoji: '🧈',
  },
  {
    barcode: '7401000000046',
    name: 'Pan de caja',
    category: 'Panadería',
    emoji: '🍞',
  },
  {
    barcode: '7401000000053',
    name: 'Tortillas de maíz 1 libra',
    category: 'Panadería',
    emoji: '🫓',
  },
  {
    barcode: '7401000000060',
    name: 'Gaseosa 2 litros',
    category: 'Bebidas',
    emoji: '🥤',
  },
  {
    barcode: '7401000000077',
    name: 'Jugo de naranja 1 litro',
    category: 'Bebidas',
    emoji: '🧃',
  },
  {
    barcode: '7401000000084',
    name: 'Agua pura 600 ml',
    category: 'Bebidas',
    emoji: '💧',
  },
  {
    barcode: '7401000000091',
    name: 'Café molido 400 g',
    category: 'Despensa',
    emoji: '☕',
  },
  {
    barcode: '7401000000107',
    name: 'Huevos docena',
    category: 'Frescos',
    emoji: '🥚',
  },
  {
    barcode: '7401000000114',
    name: 'Frijol negro volteado en lata',
    category: 'Despensa',
    emoji: '🥫',
  },
  {
    barcode: '7401000000121',
    name: 'Arroz 2 libras',
    category: 'Despensa',
    emoji: '🍚',
  },
  {
    barcode: '7401000000138',
    name: 'Azúcar 2 libras',
    category: 'Despensa',
    emoji: '🍬',
  },
  {
    barcode: '7401000000145',
    name: 'Aceite vegetal 1 litro',
    category: 'Despensa',
    emoji: '🫗',
  },
  {
    barcode: '7401000000152',
    name: 'Espagueti 400 g',
    category: 'Despensa',
    emoji: '🍝',
  },
  {
    barcode: '7401000000169',
    name: 'Cereal de avena 500 g',
    category: 'Despensa',
    emoji: '🥣',
  },
  {
    barcode: '7401000000176',
    name: 'Galletas de soda',
    category: 'Despensa',
    emoji: '🍪',
  },
  {
    barcode: '7401000000183',
    name: 'Papel higiénico 4 rollos',
    category: 'Hogar',
    emoji: '🧻',
  },
  {
    barcode: '7401000000190',
    name: 'Detergente en polvo 1 kg',
    category: 'Hogar',
    emoji: '🧼',
  },
  {
    barcode: '7401000000206',
    name: 'Champú 400 ml',
    category: 'Cuidado personal',
    emoji: '🧴',
  },
]

export const scenarioBarcodes = [
  '7401000000015',
  '7401000000046',
  '7401000000060',
  '7401000000107',
] as const

export const demoCatalogHasValidEan13 = demoCatalog.every((product) =>
  isValidEan13(product.barcode),
)
