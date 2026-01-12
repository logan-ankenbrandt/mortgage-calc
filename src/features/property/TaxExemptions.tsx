import { Checkbox } from '../../components/Checkbox'
import { Select } from '../../components/Select'
import { InputGroup } from '../../components/InputGroup'
import { useCalculator } from '../../hooks/useCalculator'

export function TaxExemptions() {
  const { state, dispatch } = useCalculator()
  const exemptions = state.property.exemptions

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-medium text-foreground">Tax Exemptions</h4>

      <div className="grid gap-4 md:grid-cols-2">
        <Checkbox
          label="Homestead Exemption"
          description="$100,000 exemption from school district taxes"
          checked={exemptions.homestead}
          onChange={(v) => dispatch({ type: 'SET_EXEMPTION', field: 'homestead', value: v })}
        />
        <Checkbox
          label="Age 65+ Exemption"
          description="$10,000 additional exemption"
          checked={exemptions.over65}
          onChange={(v) => {
            dispatch({ type: 'SET_EXEMPTION', field: 'over65', value: v })
            if (v) dispatch({ type: 'SET_EXEMPTION', field: 'disabled', value: false })
          }}
        />
        <Checkbox
          label="Disabled Exemption"
          description="$10,000 additional exemption (cannot combine with 65+)"
          checked={exemptions.disabled}
          onChange={(v) => {
            dispatch({ type: 'SET_EXEMPTION', field: 'disabled', value: v })
            if (v) dispatch({ type: 'SET_EXEMPTION', field: 'over65', value: false })
          }}
        />
        <Checkbox
          label="Agricultural Use"
          description="~50% reduction in taxable value"
          checked={exemptions.agriculturalExemption}
          onChange={(v) => dispatch({ type: 'SET_EXEMPTION', field: 'agriculturalExemption', value: v })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Veteran Disability Rating"
          value={exemptions.veteranDisability}
          onChange={(v) => dispatch({ type: 'SET_EXEMPTION', field: 'veteranDisability', value: parseInt(v) })}
          options={[
            { value: 0, label: 'None' },
            { value: 10, label: '10-29% ($5,000)' },
            { value: 30, label: '30-49% ($7,500)' },
            { value: 50, label: '50-69% ($10,000)' },
            { value: 70, label: '70-99% ($12,000)' },
            { value: 100, label: '100% (Full Exemption)' },
          ]}
        />
        <InputGroup
          label="Local Optional %"
          value={exemptions.localOptionalPercent}
          onChange={(v) =>
            dispatch({ type: 'SET_EXEMPTION', field: 'localOptionalPercent', value: parseFloat(v) || 0 })
          }
          suffix="%"
          step="1"
        />
      </div>

      <InputGroup
        label="Custom Exemption Amount"
        value={exemptions.customExemptionAmount}
        onChange={(v) =>
          dispatch({ type: 'SET_EXEMPTION', field: 'customExemptionAmount', value: parseFloat(v) || 0 })
        }
        prefix="$"
        className="max-w-xs"
      />
    </div>
  )
}
