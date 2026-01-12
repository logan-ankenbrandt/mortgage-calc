import { useState, useEffect, useMemo } from 'react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { useCalculator } from '../../hooks/useCalculator'
import { formatCurrency } from '../../utils/formatters'

interface VariableIncomeModalProps {
  open: boolean
  onClose: () => void
}

export function VariableIncomeModal({ open, onClose }: VariableIncomeModalProps) {
  const { state, dispatch, computed } = useCalculator()
  const [activeTab, setActiveTab] = useState<'early' | 'delayed'>('early')
  const [earlyValues, setEarlyValues] = useState<number[]>([])
  const [delayedValues, setDelayedValues] = useState<number[]>([])

  // Generate month labels
  const generateMonthLabels = (count: number) => {
    const labels: string[] = []
    const now = new Date()
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i)
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
    }
    return labels
  }

  const earlyMonths = useMemo(() => generateMonthLabels(computed.monthsToEarly), [computed.monthsToEarly])
  const delayedMonths = useMemo(() => generateMonthLabels(computed.monthsToDelayed), [computed.monthsToDelayed])

  // Initialize local state when modal opens
  useEffect(() => {
    if (open) {
      const earlyLength = computed.monthsToEarly
      const delayedLength = computed.monthsToDelayed
      setEarlyValues(
        state.detailedVariableIncome.early.length === earlyLength
          ? [...state.detailedVariableIncome.early]
          : new Array(earlyLength).fill(state.income.person2Variable)
      )
      setDelayedValues(
        state.detailedVariableIncome.delayed.length === delayedLength
          ? [...state.detailedVariableIncome.delayed]
          : new Array(delayedLength).fill(state.income.person2Variable)
      )
    }
  }, [open, computed.monthsToEarly, computed.monthsToDelayed, state.detailedVariableIncome, state.income.person2Variable])

  const handleSave = () => {
    dispatch({ type: 'SET_DETAILED_INCOME', timeline: 'early', values: earlyValues })
    dispatch({ type: 'SET_DETAILED_INCOME', timeline: 'delayed', values: delayedValues })
    // Update the simple variable income to use early timeline average
    const earlyAvg = earlyValues.reduce((a, b) => a + b, 0) / earlyValues.length || 0
    dispatch({ type: 'SET_INCOME', field: 'person2Variable', value: Math.round(earlyAvg) })
    onClose()
  }

  const values = activeTab === 'early' ? earlyValues : delayedValues
  const setValues = activeTab === 'early' ? setEarlyValues : setDelayedValues
  const months = activeTab === 'early' ? earlyMonths : delayedMonths

  const total = values.reduce((a, b) => a + b, 0)
  const average = values.length > 0 ? total / values.length : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Variable Income Timeline"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Timeline</Button>
        </>
      }
    >
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'early' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          onClick={() => setActiveTab('early')}
        >
          Early Timeline
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'delayed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          onClick={() => setActiveTab('delayed')}
        >
          Delayed Timeline
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">Enter expected variable income for each month:</p>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-[300px] overflow-y-auto">
        {months.map((label, index) => (
          <div key={index} className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={values[index] ?? 0}
                onChange={(e) => {
                  const newValues = [...values]
                  newValues[index] = parseFloat(e.target.value) || 0
                  setValues(newValues)
                }}
                className="w-full h-9 pl-6 pr-2 rounded border border-border bg-background text-foreground text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-medium">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Months:</span>
          <span className="font-medium">{values.length}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Average:</span>
          <span className="font-medium">{formatCurrency(average)}</span>
        </div>
      </div>
    </Modal>
  )
}
