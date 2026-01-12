import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <section className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-foreground mb-6">{title}</h2>
      {children}
    </section>
  )
}
