import clsx from 'clsx'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  tone?: 'neutral' | 'good' | 'warning' | 'danger'
}

export const MetricCard = ({ label, value, subtitle, tone = 'neutral' }: MetricCardProps) => {
  return (
    <article className={clsx('metric-card', `metric-card--${tone}`)}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {subtitle ? <p className="metric-card__subtitle">{subtitle}</p> : null}
    </article>
  )
}
