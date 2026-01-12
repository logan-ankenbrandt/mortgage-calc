import { useState } from 'react'
import { Section } from '../../components/Section'
import { InputGroup } from '../../components/InputGroup'
import { Select } from '../../components/Select'
import { Checkbox } from '../../components/Checkbox'
import { Button } from '../../components/Button'
import { useCalculator } from '../../hooks/useCalculator'
import { formatCurrency } from '../../utils/formatters'
import { VariableIncomeModal } from './VariableIncomeModal'

export function IncomeSection() {
  const { state, dispatch, computed } = useCalculator()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Section title="Income & Expenses">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InputGroup
          label="Person 1 Monthly Income"
          value={state.income.person1}
          onChange={(v) => dispatch({ type: 'SET_INCOME', field: 'person1', value: parseFloat(v) || 0 })}
          prefix="$"
        />
        <InputGroup
          label="Person 2 Base Monthly Income"
          value={state.income.person2Base}
          onChange={(v) => dispatch({ type: 'SET_INCOME', field: 'person2Base', value: parseFloat(v) || 0 })}
          prefix="$"
        />
        <InputGroup
          label="Person 2 Variable Income"
          value={state.income.person2Variable}
          onChange={(v) => dispatch({ type: 'SET_INCOME', field: 'person2Variable', value: parseFloat(v) || 0 })}
          prefix="$"
          disabled={state.income.variableMode === 'detailed'}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Select
          label="Variable Income Mode"
          value={state.income.variableMode}
          onChange={(v) => dispatch({ type: 'SET_INCOME', field: 'variableMode', value: v })}
          options={[
            { value: 'simple', label: 'Simple Average' },
            { value: 'detailed', label: 'Detailed Timeline' },
          ]}
          className="w-48"
        />
        {state.income.variableMode === 'detailed' && (
          <Button onClick={() => setModalOpen(true)} className="mt-6">
            Configure Timeline
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <InputGroup
          label="Monthly Expenses"
          value={state.expenses}
          onChange={(v) => dispatch({ type: 'SET_EXPENSES', value: parseFloat(v) || 0 })}
          prefix="$"
        />
        <div className="space-y-3">
          <InputGroup
            label="Monthly Savings"
            value={computed.monthlySavings}
            onChange={(v) => dispatch({ type: 'SET_SAVINGS', field: 'monthly', value: parseFloat(v) || 0 })}
            prefix="$"
            disabled={!state.savings.manualOverride}
          />
          <Checkbox
            label="Override calculated savings"
            checked={state.savings.manualOverride}
            onChange={(v) => dispatch({ type: 'SET_SAVINGS', field: 'manualOverride', value: v })}
          />
        </div>
      </div>

      {/* Income Summary */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-3">Income Scenarios</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Full Income</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(computed.fullIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Conservative (Person 2 only)</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(computed.conservativeIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Family Planning (Base only)</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(computed.familyPlanningIncome)}</p>
          </div>
        </div>
      </div>

      <VariableIncomeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Section>
  )
}
