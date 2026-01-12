import type { TaxExemptions, TaxResult, ScenarioResult, IncomeScenarios, CalculatorState } from '../types'

// Mortgage payment using standard amortization formula
export function calculateMortgagePayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0

  // Handle 0% interest rate case
  if (annualRate <= 0) {
    return principal / (years * 12)
  }

  const monthlyRate = annualRate / 100 / 12
  const numberOfPayments = years * 12

  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  )
}

// Total monthly housing cost
export function calculateMonthlyHousing(
  mortgagePayment: number,
  annualPropertyTax: number,
  annualInsurance: number,
  monthlyUtilities: number
): number {
  return mortgagePayment + annualPropertyTax / 12 + annualInsurance / 12 + monthlyUtilities
}

// Housing cost as percentage of income
export function calculateAffordabilityPercentage(monthlyHousing: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0
  return (monthlyHousing / monthlyIncome) * 100
}

// Projected savings over time
export function calculateSavingsAccumulation(currentSavings: number, monthlySavings: number, months: number): number {
  return currentSavings + monthlySavings * months
}

// Veteran disability exemption amounts
function getVeteranDisabilityExemption(rating: number): number | 'full' {
  switch (rating) {
    case 10:
      return 5000
    case 30:
      return 7500
    case 50:
      return 10000
    case 70:
      return 12000
    case 100:
      return 'full'
    default:
      return 0
  }
}

// Calculate total Texas property tax exemptions
function calculateExemptionTotal(homePrice: number, exemptions: TaxExemptions): { total: number; isFull: boolean } {
  let total = 0

  // Homestead: $100,000 from school district taxes
  if (exemptions.homestead) {
    total += 100000
  }

  // Age 65+ or Disabled: $10,000 (cannot combine)
  if (exemptions.over65 || exemptions.disabled) {
    total += 10000
  }

  // Veteran disability
  const veteranExemption = getVeteranDisabilityExemption(exemptions.veteranDisability)
  if (veteranExemption === 'full') {
    return { total: homePrice, isFull: true }
  }
  total += veteranExemption

  // Local optional: up to 20% of value, minimum $5,000
  if (exemptions.localOptionalPercent > 0) {
    const percentageExemption = homePrice * (exemptions.localOptionalPercent / 100)
    total += Math.max(percentageExemption, 5000)
  }

  // Agricultural/Timber: ~50% reduction
  if (exemptions.agriculturalExemption) {
    total += homePrice * 0.5
  }

  // Custom exemption amount
  if (exemptions.customExemptionAmount > 0) {
    total += exemptions.customExemptionAmount
  }

  return { total: Math.min(total, homePrice), isFull: false }
}

// Calculate Texas property tax with exemptions
export function calculateTexasPropertyTax(homePrice: number, taxRate: number, exemptions: TaxExemptions): TaxResult {
  const exemptionResult = calculateExemptionTotal(homePrice, exemptions)

  if (exemptionResult.isFull) {
    return {
      assessedValue: homePrice,
      totalExemptions: homePrice,
      taxableValue: 0,
      annualTax: 0,
      monthlyTax: 0,
      effectiveRate: 0,
    }
  }

  const taxableValue = Math.max(0, homePrice - exemptionResult.total)
  const annualTax = taxableValue * (taxRate / 100)

  return {
    assessedValue: homePrice,
    totalExemptions: exemptionResult.total,
    taxableValue,
    annualTax,
    monthlyTax: annualTax / 12,
    effectiveRate: homePrice > 0 ? (annualTax / homePrice) * 100 : 0,
  }
}

// Calculate all three income scenarios
export function calculateIncomeScenarios(state: CalculatorState): IncomeScenarios {
  const { person1, person2Base, person2Variable } = state.income
  return {
    fullIncome: person1 + person2Base + person2Variable,
    conservativeIncome: person2Base + person2Variable,
    familyPlanningIncome: person2Base,
  }
}

// Calculate a single scenario's results
export function calculateScenario(
  homePrice: number,
  downPayment: number,
  interestRate: number,
  loanTerm: number,
  annualPropertyTax: number,
  annualInsurance: number,
  monthlyUtilities: number,
  incomeScenarios: IncomeScenarios
): ScenarioResult {
  const loanAmount = homePrice - downPayment
  const mortgagePayment = calculateMortgagePayment(loanAmount, interestRate, loanTerm)
  const totalMonthlyHousing = calculateMonthlyHousing(
    mortgagePayment,
    annualPropertyTax,
    annualInsurance,
    monthlyUtilities
  )

  const fullPercentage = calculateAffordabilityPercentage(totalMonthlyHousing, incomeScenarios.fullIncome)
  const conservativePercentage = calculateAffordabilityPercentage(
    totalMonthlyHousing,
    incomeScenarios.conservativeIncome
  )
  const familyPercentage = calculateAffordabilityPercentage(totalMonthlyHousing, incomeScenarios.familyPlanningIncome)

  let affordabilityStatus: ScenarioResult['affordabilityStatus']
  if (familyPercentage <= 25) {
    affordabilityStatus = 'affordable'
  } else if (conservativePercentage <= 25) {
    affordabilityStatus = 'requires-variable'
  } else {
    affordabilityStatus = 'not-affordable'
  }

  return {
    downPayment,
    loanAmount,
    mortgagePayment,
    totalMonthlyHousing,
    fullPercentage,
    conservativePercentage,
    familyPercentage,
    affordabilityStatus,
  }
}

// Calculate months between now and a target date
export function calculateMonthsToDate(targetDate: string): number {
  if (!targetDate) return 0
  const now = new Date()
  const target = new Date(targetDate)
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(0, months)
}

// ============================================================
// AMORTIZATION SCHEDULE
// ============================================================

export interface AmortizationRow {
  month: number
  year: number
  payment: number
  principal: number
  interest: number
  balance: number
  cumulativeInterest: number
  cumulativePrincipal: number
}

export interface AmortizationSchedule {
  rows: AmortizationRow[]
  totalPayments: number
  totalInterest: number
  totalPrincipal: number
  payoffDate: Date
  monthlyPayment: number
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number,
  startDate: Date = new Date()
): AmortizationSchedule {
  const monthlyPayment = calculateMortgagePayment(principal, annualRate, years)
  const monthlyRate = annualRate / 100 / 12
  const numberOfPayments = years * 12

  const rows: AmortizationRow[] = []
  let balance = principal
  let cumulativeInterest = 0
  let cumulativePrincipal = 0

  for (let month = 1; month <= numberOfPayments; month++) {
    const interestPayment = balance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    balance = Math.max(0, balance - principalPayment)

    cumulativeInterest += interestPayment
    cumulativePrincipal += principalPayment

    const year = Math.ceil(month / 12)

    rows.push({
      month,
      year,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      cumulativeInterest,
      cumulativePrincipal,
    })
  }

  const payoffDate = new Date(startDate)
  payoffDate.setMonth(payoffDate.getMonth() + numberOfPayments)

  return {
    rows,
    totalPayments: monthlyPayment * numberOfPayments,
    totalInterest: cumulativeInterest,
    totalPrincipal: principal,
    payoffDate,
    monthlyPayment,
  }
}

// Get yearly summary from amortization schedule
export function getYearlySummary(schedule: AmortizationSchedule): {
  year: number
  totalPayments: number
  totalPrincipal: number
  totalInterest: number
  endingBalance: number
}[] {
  const yearlyData: Map<number, { principal: number; interest: number; payments: number; endBalance: number }> = new Map()

  for (const row of schedule.rows) {
    const existing = yearlyData.get(row.year) || { principal: 0, interest: 0, payments: 0, endBalance: 0 }
    existing.principal += row.principal
    existing.interest += row.interest
    existing.payments += row.payment
    existing.endBalance = row.balance
    yearlyData.set(row.year, existing)
  }

  return Array.from(yearlyData.entries()).map(([year, data]) => ({
    year,
    totalPayments: data.payments,
    totalPrincipal: data.principal,
    totalInterest: data.interest,
    endingBalance: data.endBalance,
  }))
}

// ============================================================
// PMI CALCULATION
// ============================================================

export interface PMIResult {
  required: boolean
  monthlyPMI: number
  annualPMI: number
  ltv: number
  monthsUntilRemoval: number | null
  totalPMICost: number
}

export function calculatePMI(
  loanAmount: number,
  homePrice: number,
  annualPMIRate: number = 0.5, // Default 0.5% of loan amount per year
  amortization?: AmortizationSchedule
): PMIResult {
  const ltv = (loanAmount / homePrice) * 100

  // PMI not required if LTV <= 80%
  if (ltv <= 80) {
    return {
      required: false,
      monthlyPMI: 0,
      annualPMI: 0,
      ltv,
      monthsUntilRemoval: null,
      totalPMICost: 0,
    }
  }

  const annualPMI = loanAmount * (annualPMIRate / 100)
  const monthlyPMI = annualPMI / 12

  // Calculate months until PMI can be removed (when LTV reaches 80%)
  let monthsUntilRemoval: number | null = null
  let totalPMICost = 0

  if (amortization) {
    const target80LTV = homePrice * 0.8
    for (const row of amortization.rows) {
      if (row.balance <= target80LTV) {
        monthsUntilRemoval = row.month
        totalPMICost = monthlyPMI * row.month
        break
      }
    }
  }

  return {
    required: true,
    monthlyPMI,
    annualPMI,
    ltv,
    monthsUntilRemoval,
    totalPMICost,
  }
}

// ============================================================
// CLOSING COSTS ESTIMATION
// ============================================================

export interface ClosingCostBreakdown {
  loanOrigination: number
  appraisal: number
  inspection: number
  titleInsurance: number
  escrowDeposit: number
  recordingFees: number
  attorneyFees: number
  prepaidInterest: number
  total: number
}

export interface ClosingCostInputs {
  loanOriginationPercent?: number // Default 1%
  appraisal?: number // Default $500
  inspection?: number // Default $400
  titleInsurancePercent?: number // Default 0.5%
  escrowMonths?: number // Default 2 months
  recordingFees?: number // Default $125
  attorneyFees?: number // Default $500
  prepaidDays?: number // Default 15 days
}

export function estimateClosingCosts(
  homePrice: number,
  loanAmount: number,
  annualPropertyTax: number,
  annualInsurance: number,
  interestRate: number,
  inputs: ClosingCostInputs = {}
): ClosingCostBreakdown {
  const {
    loanOriginationPercent = 1,
    appraisal = 500,
    inspection = 400,
    titleInsurancePercent = 0.5,
    escrowMonths = 2,
    recordingFees = 125,
    attorneyFees = 500,
    prepaidDays = 15,
  } = inputs

  const loanOrigination = loanAmount * (loanOriginationPercent / 100)
  const titleInsurance = homePrice * (titleInsurancePercent / 100)
  const escrowDeposit = ((annualPropertyTax + annualInsurance) / 12) * escrowMonths
  const dailyInterest = (loanAmount * (interestRate / 100)) / 365
  const prepaidInterest = dailyInterest * prepaidDays

  const total =
    loanOrigination +
    appraisal +
    inspection +
    titleInsurance +
    escrowDeposit +
    recordingFees +
    attorneyFees +
    prepaidInterest

  return {
    loanOrigination,
    appraisal,
    inspection,
    titleInsurance,
    escrowDeposit,
    recordingFees,
    attorneyFees,
    prepaidInterest,
    total,
  }
}

// ============================================================
// DTI (DEBT-TO-INCOME) CALCULATION
// ============================================================

export interface DebtObligations {
  carPayments: number
  studentLoans: number
  creditCards: number
  otherDebt: number
  childSupport: number
}

export interface DTIResult {
  frontEndRatio: number
  backEndRatio: number
  frontEndStatus: 'good' | 'acceptable' | 'high'
  backEndStatus: 'good' | 'acceptable' | 'high'
  maxHousingPayment28: number
  maxTotalDebt36: number
  qualificationStatus: 'qualified' | 'marginal' | 'not-qualified'
  totalMonthlyDebt: number
}

export function calculateDTI(
  grossMonthlyIncome: number,
  housingCosts: number,
  otherDebt: DebtObligations = { carPayments: 0, studentLoans: 0, creditCards: 0, otherDebt: 0, childSupport: 0 }
): DTIResult {
  if (grossMonthlyIncome <= 0) {
    return {
      frontEndRatio: 0,
      backEndRatio: 0,
      frontEndStatus: 'good',
      backEndStatus: 'good',
      maxHousingPayment28: 0,
      maxTotalDebt36: 0,
      qualificationStatus: 'not-qualified',
      totalMonthlyDebt: housingCosts,
    }
  }

  const totalOtherDebt =
    otherDebt.carPayments +
    otherDebt.studentLoans +
    otherDebt.creditCards +
    otherDebt.otherDebt +
    otherDebt.childSupport

  const totalMonthlyDebt = housingCosts + totalOtherDebt

  // Front-end ratio: housing costs / income (target: 28%)
  const frontEndRatio = (housingCosts / grossMonthlyIncome) * 100

  // Back-end ratio: total debt / income (target: 36%)
  const backEndRatio = (totalMonthlyDebt / grossMonthlyIncome) * 100

  // Status determination
  const getFrontEndStatus = (ratio: number): 'good' | 'acceptable' | 'high' => {
    if (ratio <= 28) return 'good'
    if (ratio <= 31) return 'acceptable'
    return 'high'
  }

  const getBackEndStatus = (ratio: number): 'good' | 'acceptable' | 'high' => {
    if (ratio <= 36) return 'good'
    if (ratio <= 43) return 'acceptable'
    return 'high'
  }

  const frontEndStatus = getFrontEndStatus(frontEndRatio)
  const backEndStatus = getBackEndStatus(backEndRatio)

  // Maximum payments based on income
  const maxHousingPayment28 = grossMonthlyIncome * 0.28
  const maxTotalDebt36 = grossMonthlyIncome * 0.36

  // Qualification status
  let qualificationStatus: 'qualified' | 'marginal' | 'not-qualified'
  if (frontEndRatio <= 28 && backEndRatio <= 36) {
    qualificationStatus = 'qualified'
  } else if (frontEndRatio <= 31 && backEndRatio <= 43) {
    qualificationStatus = 'marginal'
  } else {
    qualificationStatus = 'not-qualified'
  }

  return {
    frontEndRatio,
    backEndRatio,
    frontEndStatus,
    backEndStatus,
    maxHousingPayment28,
    maxTotalDebt36,
    qualificationStatus,
    totalMonthlyDebt,
  }
}

// ============================================================
// STRESS TESTING
// ============================================================

export interface StressTestResult {
  rate: number
  rateIncrease: number
  monthlyPayment: number
  totalMonthlyHousing: number
  dtiResult: DTIResult
  affordabilityStatus: 'affordable' | 'requires-variable' | 'not-affordable'
}

export function stressTestScenario(
  principal: number,
  baseRate: number,
  loanTerm: number,
  annualPropertyTax: number,
  annualInsurance: number,
  monthlyUtilities: number,
  grossMonthlyIncome: number,
  otherDebt: DebtObligations,
  rateIncrements: number[] = [1, 2, 3]
): StressTestResult[] {
  return rateIncrements.map((increment) => {
    const newRate = baseRate + increment
    const monthlyPayment = calculateMortgagePayment(principal, newRate, loanTerm)
    const totalMonthlyHousing = calculateMonthlyHousing(
      monthlyPayment,
      annualPropertyTax,
      annualInsurance,
      monthlyUtilities
    )
    const dtiResult = calculateDTI(grossMonthlyIncome, totalMonthlyHousing, otherDebt)

    let affordabilityStatus: 'affordable' | 'requires-variable' | 'not-affordable'
    if (dtiResult.frontEndRatio <= 28) {
      affordabilityStatus = 'affordable'
    } else if (dtiResult.frontEndRatio <= 36) {
      affordabilityStatus = 'requires-variable'
    } else {
      affordabilityStatus = 'not-affordable'
    }

    return {
      rate: newRate,
      rateIncrease: increment,
      monthlyPayment,
      totalMonthlyHousing,
      dtiResult,
      affordabilityStatus,
    }
  })
}

// ============================================================
// SAVINGS GOAL CALCULATOR
// ============================================================

export interface SavingsGoalResult {
  targetAmount: number
  downPaymentTarget: number
  closingCostsTarget: number
  reservesTarget: number
  currentProgress: number
  remainingNeeded: number
  monthsToGoal: number | null
  targetDate: Date | null
  monthlyRequired: number | null
  progressPercentage: number
}

export function calculateSavingsGoal(
  homePrice: number,
  targetDownPaymentPercent: number = 20,
  closingCosts: number,
  reserveMonths: number = 3,
  monthlyHousingCost: number,
  currentSavings: number,
  monthlySavings: number,
  targetDate?: Date
): SavingsGoalResult {
  const downPaymentTarget = homePrice * (targetDownPaymentPercent / 100)
  const reservesTarget = monthlyHousingCost * reserveMonths
  const targetAmount = downPaymentTarget + closingCosts + reservesTarget

  const remainingNeeded = Math.max(0, targetAmount - currentSavings)
  const progressPercentage = Math.min(100, (currentSavings / targetAmount) * 100)

  let monthsToGoal: number | null = null
  let calculatedTargetDate: Date | null = null
  let monthlyRequired: number | null = null

  if (remainingNeeded > 0) {
    if (monthlySavings > 0) {
      monthsToGoal = Math.ceil(remainingNeeded / monthlySavings)
      calculatedTargetDate = new Date()
      calculatedTargetDate.setMonth(calculatedTargetDate.getMonth() + monthsToGoal)
    }

    if (targetDate) {
      const now = new Date()
      const monthsUntilTarget =
        (targetDate.getFullYear() - now.getFullYear()) * 12 +
        (targetDate.getMonth() - now.getMonth())
      if (monthsUntilTarget > 0) {
        monthlyRequired = remainingNeeded / monthsUntilTarget
      }
    }
  }

  return {
    targetAmount,
    downPaymentTarget,
    closingCostsTarget: closingCosts,
    reservesTarget,
    currentProgress: currentSavings,
    remainingNeeded,
    monthsToGoal,
    targetDate: targetDate ?? calculatedTargetDate,
    monthlyRequired,
    progressPercentage,
  }
}

// ============================================================
// MORTGAGE INTEREST TAX DEDUCTION
// ============================================================

export interface TaxDeductionResult {
  annualDeductibleInterest: number
  taxSavings: number
  effectiveMonthlyBenefit: number
  worthItemizing: boolean
  deductibleByYear: { year: number; interest: number; savings: number }[]
}

export function calculateMortgageInterestDeduction(
  amortization: AmortizationSchedule,
  marginalTaxRate: number, // e.g., 0.22 for 22%
  standardDeduction: number = 29200, // 2024 married filing jointly
  yearsToAnalyze: number = 5
): TaxDeductionResult {
  const yearlySummary = getYearlySummary(amortization)
  const deductibleByYear: { year: number; interest: number; savings: number }[] = []

  let totalInterest = 0
  let totalSavings = 0

  for (let i = 0; i < Math.min(yearsToAnalyze, yearlySummary.length); i++) {
    const yearData = yearlySummary[i]
    if (!yearData) continue

    const interest = yearData.totalInterest
    const savings = interest * marginalTaxRate

    deductibleByYear.push({
      year: yearData.year,
      interest,
      savings,
    })

    totalInterest += interest
    totalSavings += savings
  }

  const avgAnnualInterest = totalInterest / Math.min(yearsToAnalyze, yearlySummary.length)
  const worthItemizing = avgAnnualInterest > standardDeduction

  return {
    annualDeductibleInterest: avgAnnualInterest,
    taxSavings: totalSavings / Math.min(yearsToAnalyze, yearlySummary.length),
    effectiveMonthlyBenefit: totalSavings / (Math.min(yearsToAnalyze, yearlySummary.length) * 12),
    worthItemizing,
    deductibleByYear,
  }
}
