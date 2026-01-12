import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { CalculatorState, CalculatorAction, TaxExemptions } from '../types'
import { getStateFromURL } from '../utils/export'

const STORAGE_KEY = 'mortgage-calculator-state'

const defaultExemptions: TaxExemptions = {
  homestead: true,
  over65: false,
  disabled: false,
  veteranDisability: 0,
  localOptionalPercent: 0,
  agriculturalExemption: false,
  customExemptionAmount: 0,
}

const initialState: CalculatorState = {
  income: {
    person1: 0,
    person2Base: 0,
    person2Variable: 0,
    variableMode: 'simple',
  },
  expenses: 0,
  property: {
    price: 275000,
    currentRate: 6.3,
    altRate: 3.5,
    loanTerm: 20,
    propertyTaxRate: 1.53,
    insurance: 2875,
    utilities: 500,
    exemptions: defaultExemptions,
  },
  savings: {
    current: 0,
    monthly: 0,
    manualOverride: false,
  },
  purchaseDates: {
    early: '2026-05-01',
    delayed: '2026-12-01',
  },
  detailedVariableIncome: {
    early: [],
    delayed: [],
  },
}

function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'SET_INCOME':
      return {
        ...state,
        income: { ...state.income, [action.field]: action.value },
      }
    case 'SET_EXPENSES':
      return { ...state, expenses: action.value }
    case 'SET_PROPERTY':
      return {
        ...state,
        property: { ...state.property, [action.field]: action.value },
      }
    case 'SET_EXEMPTION':
      return {
        ...state,
        property: {
          ...state.property,
          exemptions: { ...state.property.exemptions, [action.field]: action.value },
        },
      }
    case 'SET_SAVINGS':
      return {
        ...state,
        savings: { ...state.savings, [action.field]: action.value },
      }
    case 'SET_PURCHASE_DATE':
      return {
        ...state,
        purchaseDates: { ...state.purchaseDates, [action.field]: action.value },
      }
    case 'SET_DETAILED_INCOME':
      return {
        ...state,
        detailedVariableIncome: {
          ...state.detailedVariableIncome,
          [action.timeline]: action.values,
        },
      }
    case 'LOAD_STATE':
      return action.state
    case 'RESET':
      return initialState
    default:
      return state
  }
}

function loadFromStorage(): CalculatorState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

function saveToStorage(state: CalculatorState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

interface CalculatorContextValue {
  state: CalculatorState
  dispatch: React.Dispatch<CalculatorAction>
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null)

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState, (initial) => {
    // Check URL for shared state first
    const urlState = getStateFromURL()
    if (urlState) {
      // Merge with initial state to ensure all fields are present
      return {
        ...initial,
        ...urlState,
        income: { ...initial.income, ...urlState.income },
        property: {
          ...initial.property,
          ...urlState.property,
          exemptions: {
            ...initial.property.exemptions,
            ...urlState.property?.exemptions,
          },
        },
        savings: { ...initial.savings, ...urlState.savings },
        purchaseDates: { ...initial.purchaseDates, ...urlState.purchaseDates },
      }
    }

    // Fall back to localStorage
    const stored = loadFromStorage()
    return stored ?? initial
  })

  // Persist state changes
  useEffect(() => {
    saveToStorage(state)
  }, [state])

  return <CalculatorContext.Provider value={{ state, dispatch }}>{children}</CalculatorContext.Provider>
}

export function useCalculatorContext(): CalculatorContextValue {
  const context = useContext(CalculatorContext)
  if (!context) {
    throw new Error('useCalculatorContext must be used within CalculatorProvider')
  }
  return context
}
