interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
  className?: string
}

export function Checkbox({ label, checked, onChange, description, className = '' }: CheckboxProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
      />
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </label>
  )
}
