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

  // Find best scenario (affordable with lowest housing cost)
  const scenarioList = [
    { key: 'earlyCurrentRate', scenario: computed.scenarios.earlyCurrentRate },
    { key: 'delayedCurrentRate', scenario: computed.scenarios.delayedCurrentRate },
    { key: 'earlyAltRate', scenario: computed.scenarios.earlyAltRate },
    { key: 'delayedAltRate', scenario: computed.scenarios.delayedAltRate },
  ]
  const bestKey = scenarioList
    .filter(s => s.scenario.affordabilityStatus === 'affordable')
    .sort((a, b) => a.scenario.totalMonthlyHousing - b.scenario.totalMonthlyHousing)[0]?.key || null

  return (
    <Section title="Scenario Comparison">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScenarioCard
          title={`${earlyLabel} @ ${state.property.currentRate}%`}
          scenario={computed.scenarios.earlyCurrentRate}
          isBest={bestKey === 'earlyCurrentRate'}
        />
        <ScenarioCard
          title={`${delayedLabel} @ ${state.property.currentRate}%`}
          scenario={computed.scenarios.delayedCurrentRate}
          isBest={bestKey === 'delayedCurrentRate'}
        />
        <ScenarioCard
          title={`${earlyLabel} @ ${state.property.altRate}%`}
          scenario={computed.scenarios.earlyAltRate}
          isBest={bestKey === 'earlyAltRate'}
        />
        <ScenarioCard
          title={`${delayedLabel} @ ${state.property.altRate}%`}
          scenario={computed.scenarios.delayedAltRate}
          isBest={bestKey === 'delayedAltRate'}
        />
      </div>
    </Section>
  )
}
