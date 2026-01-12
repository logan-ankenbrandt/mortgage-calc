import { Section } from '../../components/Section'
import { ProgressBar } from '../../components/ProgressBar'
import { useCalculator } from '../../hooks/useCalculator'
import { formatCurrency } from '../../utils/formatters'

export function SavingsTracker() {
  const { state, computed } = useCalculator()

  // Target is the home price (down payment goal)
  const targetDownPayment = state.property.price * 0.2 // 20% down payment goal

  // Calculate milestone positions for visual timeline (as percentages)
  const maxValue = Math.max(targetDownPayment, computed.delayedSavings) * 1.1
  const nowPos = (state.savings.current / maxValue) * 100
  const earlyPos = (computed.earlySavings / maxValue) * 100
  const delayedPos = (computed.delayedSavings / maxValue) * 100
  const goalPos = (targetDownPayment / maxValue) * 100

  // Format short date
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <Section title="Savings Timeline">
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Current Savings</p>
            <p className="text-lg font-semibold">{formatCurrency(state.savings.current)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Rate</p>
            <p className="text-lg font-semibold">{formatCurrency(computed.monthlySavings)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">At Early ({computed.monthsToEarly}mo)</p>
            <p className="text-lg font-semibold">{formatCurrency(computed.earlySavings)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">At Delayed ({computed.monthsToDelayed}mo)</p>
            <p className="text-lg font-semibold">{formatCurrency(computed.delayedSavings)}</p>
          </div>
        </div>

        {/* Visual timeline */}
        <div className="pt-4">
          <div className="relative h-16">
            {/* Track */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full" />

            {/* Progress fill to current */}
            <div
              className="absolute top-6 left-0 h-1 bg-primary/30 rounded-full"
              style={{ width: `${Math.min(delayedPos, 100)}%` }}
            />

            {/* Now marker */}
            <div
              className="absolute top-3 flex flex-col items-center"
              style={{ left: `${Math.min(nowPos, 98)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-background" />
              <div className="mt-3 text-center">
                <p className="text-[10px] font-medium text-primary">Now</p>
              </div>
            </div>

            {/* Early date marker */}
            {computed.monthsToEarly > 0 && (
              <div
                className="absolute top-3 flex flex-col items-center"
                style={{ left: `${Math.min(earlyPos, 96)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-background" />
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-muted-foreground">{formatShortDate(state.purchaseDates.early)}</p>
                </div>
              </div>
            )}

            {/* Delayed date marker */}
            {computed.monthsToDelayed > 0 && (
              <div
                className="absolute top-3 flex flex-col items-center"
                style={{ left: `${Math.min(delayedPos, 96)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-muted-foreground">{formatShortDate(state.purchaseDates.delayed)}</p>
                </div>
              </div>
            )}

            {/* Goal marker */}
            <div
              className="absolute top-3 flex flex-col items-center"
              style={{ left: `${Math.min(goalPos, 98)}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-background" />
              <div className="mt-3 text-center">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">20% Goal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Progress toward 20% down ({formatCurrency(targetDownPayment)})</span>
            <span>{Math.round((computed.delayedSavings / targetDownPayment) * 100)}%</span>
          </div>
          <ProgressBar value={computed.delayedSavings} max={targetDownPayment} />
        </div>
      </div>
    </Section>
  )
}
