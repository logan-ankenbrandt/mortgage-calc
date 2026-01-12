export interface TaxExemptions {
  homestead: boolean
  over65: boolean
  disabled: boolean
  veteranDisability: 0 | 10 | 30 | 50 | 70 | 100
  localOptionalPercent: number
  agriculturalExemption: boolean
  customExemptionAmount: number
}

export interface CalculatorState {
  income: {
    person1: number
    person2Base: number
    person2Variable: number
    variableMode: 'simple' | 'detailed'
  }
  expenses: number
  property: {
    price: number
    currentRate: number
    altRate: number
    loanTerm: 15 | 20 | 30
    propertyTaxRate: number
    insurance: number
    utilities: number
    exemptions: TaxExemptions
  }
  savings: {
    current: number
    monthly: number
    manualOverride: boolean
  }
  purchaseDates: {
    early: string
    delayed: string
  }
  detailedVariableIncome: {
    early: number[]
    delayed: number[]
  }
}

export interface TaxResult {
  assessedValue: number
  totalExemptions: number
  taxableValue: number
  annualTax: number
  monthlyTax: number
  effectiveRate: number
}

export interface ScenarioResult {
  downPayment: number
  loanAmount: number
  mortgagePayment: number
  totalMonthlyHousing: number
  fullPercentage: number
  conservativePercentage: number
  familyPercentage: number
  affordabilityStatus: 'affordable' | 'requires-variable' | 'not-affordable'
}

export interface IncomeScenarios {
  fullIncome: number
  conservativeIncome: number
  familyPlanningIncome: number
}

export type CalculatorAction =
  | { type: 'SET_INCOME'; field: keyof CalculatorState['income']; value: number | string }
  | { type: 'SET_EXPENSES'; value: number }
  | { type: 'SET_PROPERTY'; field: keyof CalculatorState['property']; value: number | string }
  | { type: 'SET_EXEMPTION'; field: keyof TaxExemptions; value: boolean | number }
  | { type: 'SET_SAVINGS'; field: keyof CalculatorState['savings']; value: number | boolean }
  | { type: 'SET_PURCHASE_DATE'; field: 'early' | 'delayed'; value: string }
  | { type: 'SET_DETAILED_INCOME'; timeline: 'early' | 'delayed'; values: number[] }
  | { type: 'LOAD_STATE'; state: CalculatorState }
  | { type: 'RESET' }
