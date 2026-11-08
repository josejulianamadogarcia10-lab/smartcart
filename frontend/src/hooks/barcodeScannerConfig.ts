export const barcodeScannerConfig = {
  prefix: '',
  suffixes: ['Enter', 'Tab'] as const,
  minLength: 8,
  maxLength: 14,
  maxKeyIntervalMs: 50,
  duplicateWindowMs: 300,
} as const
