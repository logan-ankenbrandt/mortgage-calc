const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-US')

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value))
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
