interface ProgressBarProps {
  value: number
  max: number
  className?: string
}

export function ProgressBar({ value, max, className = '' }: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  return (
    <div className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
