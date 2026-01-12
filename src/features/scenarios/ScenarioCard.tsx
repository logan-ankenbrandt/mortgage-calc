import type { ScenarioResult } from '../../types'
import { formatCurrency, formatPercent } from '../../utils/formatters'

interface ScenarioCardProps {
  title: string
  scenario: ScenarioResult
}

export function ScenarioCard({ title, scenario }: ScenarioCardProps) {
  const statusStyles = {
    affordable: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    'requires-variable': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    'not-affordable': 'bg-destructive/10 text-destructive',
  }

  const statusText = {
    affordable: 'Affordable on base income',
    'requires-variable': 'Requires variable income',
    'not-affordable': 'Not affordable',
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
      <h3 className="font-medium text-foreground mb-4">{title}</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Down Payment</span>
          <span className="font-medium">{formatCurrency(scenario.downPayment)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Loan Amount</span>
          <span className="font-medium">{formatCurrency(scenario.loanAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Monthly Payment</span>
          <span className="font-medium">{formatCurrency(scenario.mortgagePayment)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Housing</span>
          <span className="font-semibold text-foreground">{formatCurrency(scenario.totalMonthlyHousing)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">% of Income</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full</span>
            <span>{formatPercent(scenario.fullPercentage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conservative</span>
            <span>{formatPercent(scenario.conservativePercentage)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-foreground">Family Planning</span>
            <span>{formatPercent(scenario.familyPercentage)}</span>
          </div>
        </div>
      </div>

      <div className={`mt-4 px-3 py-2 rounded text-xs font-medium text-center ${statusStyles[scenario.affordabilityStatus]}`}>
        {statusText[scenario.affordabilityStatus]}
      </div>
    </div>
  )
}
