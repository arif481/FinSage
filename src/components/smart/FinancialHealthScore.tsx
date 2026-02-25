import { FinancialHealthResult } from '@/utils/finance'

interface FinancialHealthScoreProps {
    result: FinancialHealthResult
}

export const FinancialHealthScore = ({ result }: FinancialHealthScoreProps) => {
    const circumference = 2 * Math.PI * 54
    const strokeDashoffset = circumference - (circumference * result.totalScore) / 100

    const scoreColor =
        result.totalScore >= 75 ? 'var(--success)' :
            result.totalScore >= 55 ? 'var(--primary)' :
                result.totalScore >= 35 ? 'var(--warning)' : 'var(--danger)'

    return (
        <div className="health-score">
            <div className="health-score__gauge">
                <svg viewBox="0 0 130 130" className="health-score__svg">
                    <circle cx="65" cy="65" r="54" fill="none" stroke="var(--border)" strokeWidth="7" opacity="0.25" />
                    <circle
                        cx="65" cy="65" r="54" fill="none"
                        stroke={scoreColor} strokeWidth="7" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 65 65)"
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 10px ${scoreColor})` }}
                    />
                    <circle
                        cx="65" cy="65" r="54" fill="none"
                        stroke={scoreColor} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 65 65)" opacity="0.3"
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: 'blur(4px)' }}
                    />
                </svg>
                <div className="health-score__center">
                    <span className="health-score__number glow-text" style={{ color: scoreColor }}>{result.totalScore}</span>
                    <span className="health-score__grade">{result.gradeEmoji} {result.grade}</span>
                </div>
            </div>

            <div className="health-score__breakdown">
                {result.breakdown.map((item) => (
                    <div key={item.label} className="health-bar">
                        <div className="health-bar__header">
                            <span>{item.icon} {item.label}</span>
                            <span className={`health-bar__score health-bar__score--${item.tone}`}>
                                {item.score}/{item.maxScore}
                            </span>
                        </div>
                        <div className="health-bar__track">
                            <div
                                className={`health-bar__fill health-bar__fill--${item.tone}`}
                                style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
