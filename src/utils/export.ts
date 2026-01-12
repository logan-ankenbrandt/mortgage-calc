import type { CalculatorState, TaxExemptions } from '@/types'
import type { AmortizationSchedule } from './calculations'
import LZString from 'lz-string'

// ============================================================
// CSV EXPORT
// ============================================================

/**
 * Generate CSV content from amortization schedule
 */
export function generateAmortizationCSV(schedule: AmortizationSchedule): string {
  const headers = [
    'Month',
    'Year',
    'Payment',
    'Principal',
    'Interest',
    'Balance',
    'Cumulative Principal',
    'Cumulative Interest',
  ]

  const rows = schedule.rows.map((row) => [
    row.month,
    row.year,
    row.payment.toFixed(2),
    row.principal.toFixed(2),
    row.interest.toFixed(2),
    row.balance.toFixed(2),
    row.cumulativePrincipal.toFixed(2),
    row.cumulativeInterest.toFixed(2),
  ])

  // Add summary row
  rows.push([])
  rows.push(['Summary'])
  rows.push(['Total Payments', '', schedule.totalPayments.toFixed(2)])
  rows.push(['Total Principal', '', schedule.totalPrincipal.toFixed(2)])
  rows.push(['Total Interest', '', schedule.totalInterest.toFixed(2)])
  rows.push(['Monthly Payment', '', schedule.monthlyPayment.toFixed(2)])
  rows.push(['Payoff Date', '', schedule.payoffDate.toLocaleDateString()])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Generate yearly summary CSV
 */
export function generateYearlySummaryCSV(
  yearlySummary: Array<{
    year: number
    totalPayments: number
    totalPrincipal: number
    totalInterest: number
    endingBalance: number
  }>
): string {
  const headers = ['Year', 'Total Payments', 'Principal', 'Interest', 'Ending Balance']

  const rows = yearlySummary.map((year) => [
    year.year,
    year.totalPayments.toFixed(2),
    year.totalPrincipal.toFixed(2),
    year.totalInterest.toFixed(2),
    year.endingBalance.toFixed(2),
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

/**
 * Trigger CSV download
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

// ============================================================
// URL SHARING
// ============================================================

/**
 * State fields to include in shareable URL
 */
interface ShareableState {
  // Income
  i1: number // person1
  i2b: number // person2Base
  i2v: number // person2Variable
  exp: number // expenses

  // Property
  pp: number // price
  cr: number // currentRate
  ar: number // altRate
  lt: number // loanTerm
  ptr: number // propertyTaxRate
  ins: number // insurance
  util: number // utilities

  // Exemptions
  hs: boolean // homestead
  o65: boolean // over65
  dis: boolean // disabled
  vd: number // veteranDisability
  lop: number // localOptionalPercent
  ag: boolean // agriculturalExemption
  ce: number // customExemptionAmount

  // Savings
  sc: number // current
  sm: number // monthly
  smo: boolean // manualOverride

  // Purchase Dates
  pe: string // early
  pd: string // delayed
}

/**
 * Encode calculator state to URL-safe string
 */
export function encodeStateToURL(state: CalculatorState): string {
  const shareable: ShareableState = {
    // Income
    i1: state.income.person1,
    i2b: state.income.person2Base,
    i2v: state.income.person2Variable,
    exp: state.expenses,

    // Property
    pp: state.property.price,
    cr: state.property.currentRate,
    ar: state.property.altRate,
    lt: state.property.loanTerm,
    ptr: state.property.propertyTaxRate,
    ins: state.property.insurance,
    util: state.property.utilities,

    // Exemptions
    hs: state.property.exemptions.homestead,
    o65: state.property.exemptions.over65,
    dis: state.property.exemptions.disabled,
    vd: state.property.exemptions.veteranDisability,
    lop: state.property.exemptions.localOptionalPercent,
    ag: state.property.exemptions.agriculturalExemption,
    ce: state.property.exemptions.customExemptionAmount,

    // Savings
    sc: state.savings.current,
    sm: state.savings.monthly,
    smo: state.savings.manualOverride,

    // Purchase Dates
    pe: state.purchaseDates.early,
    pd: state.purchaseDates.delayed,
  }

  const json = JSON.stringify(shareable)
  const compressed = LZString.compressToEncodedURIComponent(json)

  return compressed
}

/**
 * Decode URL string back to calculator state
 */
export function decodeStateFromURL(encoded: string): Partial<CalculatorState> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null

    const shareable: ShareableState = JSON.parse(json)

    // Validate and cast veteranDisability to allowed values
    const validVeteranDisabilities = [0, 10, 30, 50, 70, 100] as const
    const veteranDisability = validVeteranDisabilities.includes(shareable.vd as typeof validVeteranDisabilities[number])
      ? (shareable.vd as TaxExemptions['veteranDisability'])
      : 0

    return {
      income: {
        person1: shareable.i1 ?? 0,
        person2Base: shareable.i2b ?? 0,
        person2Variable: shareable.i2v ?? 0,
        variableMode: 'simple' as const,
      },
      expenses: shareable.exp ?? 0,
      property: {
        price: shareable.pp ?? 400000,
        currentRate: shareable.cr ?? 6.5,
        altRate: shareable.ar ?? 5.5,
        loanTerm: (shareable.lt as 15 | 20 | 30) ?? 30,
        propertyTaxRate: shareable.ptr ?? 2.1,
        insurance: shareable.ins ?? 2400,
        utilities: shareable.util ?? 300,
        exemptions: {
          homestead: shareable.hs ?? true,
          over65: shareable.o65 ?? false,
          disabled: shareable.dis ?? false,
          veteranDisability,
          localOptionalPercent: shareable.lop ?? 0,
          agriculturalExemption: shareable.ag ?? false,
          customExemptionAmount: shareable.ce ?? 0,
        },
      },
      savings: {
        current: shareable.sc ?? 0,
        monthly: shareable.sm ?? 0,
        manualOverride: shareable.smo ?? false,
      },
      purchaseDates: {
        early: shareable.pe ?? '',
        delayed: shareable.pd ?? '',
      },
    }
  } catch (error) {
    console.error('Error decoding state from URL:', error)
    return null
  }
}

/**
 * Generate shareable URL with encoded state
 */
export function generateShareableURL(state: CalculatorState): string {
  const encoded = encodeStateToURL(state)
  const baseURL = window.location.origin + window.location.pathname
  return `${baseURL}?s=${encoded}`
}

/**
 * Check if URL contains shared state and return it
 */
export function getStateFromURL(): Partial<CalculatorState> | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('s')

  if (!encoded) return null

  return decodeStateFromURL(encoded)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// ============================================================
// PRINT UTILITIES
// ============================================================

/**
 * Trigger browser print dialog
 */
export function printPage(): void {
  window.print()
}

/**
 * Format data for print report
 */
export interface PrintReportData {
  generatedAt: string
  homePrice: number
  downPayment: number
  loanAmount: number
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  totalInterest: number
  totalPayments: number
  payoffDate: string
  monthlyHousing: number
  dtiRatio: number
}

export function preparePrintData(
  state: CalculatorState,
  schedule: AmortizationSchedule | null,
  monthlyHousing: number,
  downPayment: number,
  dtiRatio: number
): PrintReportData | null {
  if (!schedule) return null

  return {
    generatedAt: new Date().toLocaleString(),
    homePrice: state.property.price,
    downPayment,
    loanAmount: state.property.price - downPayment,
    interestRate: state.property.currentRate,
    loanTerm: state.property.loanTerm,
    monthlyPayment: schedule.monthlyPayment,
    totalInterest: schedule.totalInterest,
    totalPayments: schedule.totalPayments,
    payoffDate: schedule.payoffDate.toLocaleDateString(),
    monthlyHousing,
    dtiRatio,
  }
}
