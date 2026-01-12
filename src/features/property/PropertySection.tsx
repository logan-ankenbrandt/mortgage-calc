import { Section } from '../../components/Section'
import { InputGroup } from '../../components/InputGroup'
import { Select } from '../../components/Select'
import { useCalculator } from '../../hooks/useCalculator'
import { TaxExemptions } from './TaxExemptions'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export function PropertySection() {
  const { state, dispatch, computed } = useCalculator()

  return (
    <Section title="Property Details">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InputGroup
          label="Home Price"
          value={state.property.price}
          onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'price', value: parseFloat(v) || 0 })}
          prefix="$"
        />
        <InputGroup
          label="Current Interest Rate"
          value={state.property.currentRate}
          onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'currentRate', value: parseFloat(v) || 0 })}
          suffix="%"
          step="0.1"
        />
        <InputGroup
          label="Alternative Interest Rate"
          value={state.property.altRate}
          onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'altRate', value: parseFloat(v) || 0 })}
          suffix="%"
          step="0.1"
        />
        <Select
          label="Loan Term"
          value={state.property.loanTerm}
          onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'loanTerm', value: parseInt(v) })}
          options={[
            { value: 15, label: '15 Years' },
            { value: 20, label: '20 Years' },
            { value: 30, label: '30 Years' },
          ]}
        />
        <InputGroup
          label="Current Savings"
          value={state.savings.current}
          onChange={(v) => dispatch({ type: 'SET_SAVINGS', field: 'current', value: parseFloat(v) || 0 })}
          prefix="$"
        />
        <InputGroup
          label="Annual Insurance"
          value={state.property.insurance}
          onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'insurance', value: parseFloat(v) || 0 })}
          prefix="$"
        />
        <InputGroup
          label="Monthly Utilities"
          value={state.property.utilities}
          onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'utilities', value: parseFloat(v) || 0 })}
          prefix="$"
        />
      </div>

      {/* Purchase Dates */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <InputGroup
          label="Early Purchase Date"
          value={state.purchaseDates.early}
          onChange={(v) => dispatch({ type: 'SET_PURCHASE_DATE', field: 'early', value: v })}
          type="text"
          placeholder="YYYY-MM-DD"
        />
        <InputGroup
          label="Delayed Purchase Date"
          value={state.purchaseDates.delayed}
          onChange={(v) => dispatch({ type: 'SET_PURCHASE_DATE', field: 'delayed', value: v })}
          type="text"
          placeholder="YYYY-MM-DD"
        />
      </div>

      {/* Property Tax Section */}
      <div className="mt-8">
        <h3 className="text-base font-medium text-foreground mb-4">Texas Property Tax</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <InputGroup
            label="Base Tax Rate"
            value={state.property.propertyTaxRate}
            onChange={(v) => dispatch({ type: 'SET_PROPERTY', field: 'propertyTaxRate', value: parseFloat(v) || 0 })}
            suffix="%"
            step="0.01"
          />
        </div>

        <TaxExemptions />

        {/* Tax Calculation Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-3">Tax Calculation</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Assessed Value</p>
              <p className="text-sm font-medium">${formatNumber(computed.taxResult.assessedValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Exemptions</p>
              <p className="text-sm font-medium">${formatNumber(computed.taxResult.totalExemptions)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxable Value</p>
              <p className="text-sm font-medium">${formatNumber(computed.taxResult.taxableValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual Tax</p>
              <p className="text-sm font-medium">{formatCurrency(computed.taxResult.annualTax)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Tax</p>
              <p className="text-sm font-medium">{formatCurrency(computed.taxResult.monthlyTax)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Effective Rate</p>
              <p className="text-sm font-medium">{computed.taxResult.effectiveRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
