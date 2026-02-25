import clsx from 'clsx'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  tone?: 'neutral' | 'good' | 'warning' | 'danger'
  stagger?: number
}

const toneIcons: Record<string, string> = {
  neutral: '📊',
  good: '✅',
  warning: '⚠️',
  danger: '🔴',
}

export const MetricCard = ({ label, value, subtitle, tone = 'neutral', stagger = 0 }: MetricCardProps) => {
  return (
    <article
      className={clsx('metric-card', `metric-card--${tone}`)}
      style={{ '--stagger': stagger } as React.CSSProperties}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem' }} aria-hidden="true">{toneIcons[tone]}</span>
        <p className="metric-card__label">{label}</p>
      </div>
      <p className="metric-card__value glow-text">{value}</p>
      {subtitle ? <p className="metric-card__subtitle">{subtitle}</p> : null}
    </article>
  )
}
