interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
}

export function Select({ label, value, onChange, options, className = '' }: SelectProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
