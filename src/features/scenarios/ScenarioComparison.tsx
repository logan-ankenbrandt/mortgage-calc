import { Section } from '../../components/Section'
import { useCalculator } from '../../hooks/useCalculator'
import { ScenarioCard } from './ScenarioCard'

export function ScenarioComparison() {
  const { state, computed } = useCalculator()

  // Format date labels
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const earlyLabel = formatDate(state.purchaseDates.early)
  const delayedLabel = formatDate(state.purchaseDates.delayed)

  return (
    <Section title="Scenario Comparison">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScenarioCard
          title={`${earlyLabel} @ ${state.property.currentRate}%`}
          scenario={computed.scenarios.earlyCurrentRate}
        />
        <ScenarioCard
          title={`${delayedLabel} @ ${state.property.currentRate}%`}
          scenario={computed.scenarios.delayedCurrentRate}
        />
        <ScenarioCard
          title={`${earlyLabel} @ ${state.property.altRate}%`}
          scenario={computed.scenarios.earlyAltRate}
        />
        <ScenarioCard
          title={`${delayedLabel} @ ${state.property.altRate}%`}
          scenario={computed.scenarios.delayedAltRate}
        />
      </div>
    </Section>
  )
}
