interface SavingsGaugeProps {
    income: number
    expenses: number
    label?: string
}

export const SavingsGauge = ({ income, expenses, label = 'Savings rate' }: SavingsGaugeProps) => {
    const savings = income - expenses
    const rate = income > 0 ? Math.round((savings / income) * 100) : 0
    const clampedRate = Math.max(0, Math.min(rate, 100))
    const circumference = 2 * Math.PI * 58
    const strokeDashoffset = circumference - (circumference * clampedRate) / 100

    const tone = rate >= 20 ? 'good' : rate >= 10 ? 'warning' : 'danger'
    const toneColors = {
        good: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
    }
    const color = toneColors[tone]

    return (
        <div className="savings-gauge" aria-label={`${label}: ${rate}%`}>
            <svg viewBox="0 0 140 140" className="savings-gauge__svg">
                {/* Background circle */}
                <circle
                    cx="70"
                    cy="70"
                    r="58"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                    opacity="0.3"
                />
                {/* Progress arc */}
                <circle
                    cx="70"
                    cy="70"
                    r="58"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 70 70)"
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: `drop-shadow(0 0 8px ${color})`,
                    }}
                />
                {/* Glow layer */}
                <circle
                    cx="70"
                    cy="70"
                    r="58"
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 70 70)"
                    opacity="0.3"
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: `blur(4px)`,
                    }}
                />
            </svg>
            <div className="savings-gauge__center">
                <span className="savings-gauge__value glow-text" style={{ color }}>{rate}%</span>
                <span className="savings-gauge__label">{label}</span>
            </div>
        </div>
    )
}
