import { Section } from '../../components/Section'
import { ProgressBar } from '../../components/ProgressBar'
import { useCalculator } from '../../hooks/useCalculator'
import { formatCurrency } from '../../utils/formatters'

export function SavingsTracker() {
  const { state, computed } = useCalculator()

  // Target is the home price (down payment goal)
  const targetDownPayment = state.property.price * 0.2 // 20% down payment goal

  return (
    <Section title="Savings Timeline">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Savings</span>
              <span className="font-semibold">{formatCurrency(state.savings.current)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monthly Savings Rate</span>
              <span className="font-semibold">{formatCurrency(computed.monthlySavings)}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Progress toward 20% down ({formatCurrency(targetDownPayment)})</span>
              <span>{Math.round((computed.delayedSavings / targetDownPayment) * 100)}%</span>
            </div>
            <ProgressBar value={computed.delayedSavings} max={targetDownPayment} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Projected at Early Date ({computed.monthsToEarly} months)
            </p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(computed.earlySavings)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Projected at Delayed Date ({computed.monthsToDelayed} months)
            </p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(computed.delayedSavings)}</p>
          </div>
        </div>
      </div>
    </Section>
  )
}
