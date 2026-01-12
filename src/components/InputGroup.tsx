interface InputGroupProps {
  label: string
  value: number | string
  onChange: (value: string) => void
  type?: 'number' | 'text'
  placeholder?: string
  disabled?: boolean
  prefix?: string
  suffix?: string
  step?: string
  className?: string
}

export function InputGroup({
  label,
  value,
  onChange,
  type = 'number',
  placeholder,
  disabled = false,
  prefix,
  suffix,
  step,
  className = '',
}: InputGroupProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          className={`
            w-full h-10 rounded-md border border-border bg-background text-foreground
            placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground
            ${prefix ? 'pl-7' : 'px-3'}
            ${suffix ? 'pr-12' : 'px-3'}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>
        )}
      </div>
    </div>
  )
}
