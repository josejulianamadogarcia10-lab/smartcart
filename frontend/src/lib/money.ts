export function formatMoney(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0)
  return `Q${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`
}
