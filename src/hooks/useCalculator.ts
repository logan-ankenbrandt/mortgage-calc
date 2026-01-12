import { useMemo } from 'react'
import { useCalculatorContext } from '../context/CalculatorContext'
import {
  calculateIncomeScenarios,
  calculateTexasPropertyTax,
  calculateSavingsAccumulation,
  calculateScenario,
  calculateMonthsToDate,
} from '../utils/calculations'

export function useCalculator() {
  const { state, dispatch } = useCalculatorContext()

  const computed = useMemo(() => {
    const incomeScenarios = calculateIncomeScenarios(state)

    // Calculate monthly savings (if not manually overridden)
    const monthlySavings = state.savings.manualOverride
      ? state.savings.monthly
      : Math.max(0, incomeScenarios.fullIncome - state.expenses)

    // Calculate months to target dates
    const monthsToEarly = calculateMonthsToDate(state.purchaseDates.early)
    const monthsToDelayed = calculateMonthsToDate(state.purchaseDates.delayed)

    // Calculate projected savings at each date
    const earlySavings = calculateSavingsAccumulation(state.savings.current, monthlySavings, monthsToEarly)
    const delayedSavings = calculateSavingsAccumulation(state.savings.current, monthlySavings, monthsToDelayed)

    // Calculate property tax with exemptions
    const taxResult = calculateTexasPropertyTax(
      state.property.price,
      state.property.propertyTaxRate,
      state.property.exemptions
    )

    // Calculate all four scenarios
    const scenarios = {
      earlyCurrentRate: calculateScenario(
        state.property.price,
        earlySavings,
        state.property.currentRate,
        state.property.loanTerm,
        taxResult.annualTax,
        state.property.insurance,
        state.property.utilities,
        incomeScenarios
      ),
      delayedCurrentRate: calculateScenario(
        state.property.price,
        delayedSavings,
        state.property.currentRate,
        state.property.loanTerm,
        taxResult.annualTax,
        state.property.insurance,
        state.property.utilities,
        incomeScenarios
      ),
      earlyAltRate: calculateScenario(
        state.property.price,
        earlySavings,
        state.property.altRate,
        state.property.loanTerm,
        taxResult.annualTax,
        state.property.insurance,
        state.property.utilities,
        incomeScenarios
      ),
      delayedAltRate: calculateScenario(
        state.property.price,
        delayedSavings,
        state.property.altRate,
        state.property.loanTerm,
        taxResult.annualTax,
        state.property.insurance,
        state.property.utilities,
        incomeScenarios
      ),
    }

    return {
      ...incomeScenarios,
      monthlySavings,
      monthsToEarly,
      monthsToDelayed,
      earlySavings,
      delayedSavings,
      taxResult,
      scenarios,
    }
  }, [state])

  return { state, dispatch, computed }
}
