import { SpendingAnomaly } from '@/utils/finance'
import { formatCurrency, formatDate } from '@/utils/format'

interface SpendingAnomaliesProps {
    anomalies: SpendingAnomaly[]
    currency: string
}

export const SpendingAnomalies = ({ anomalies, currency }: SpendingAnomaliesProps) => {
    if (anomalies.length === 0) {
        return (
            <div className="anomaly-empty">
                <span style={{ fontSize: '2rem' }}>✅</span>
                <p>No spending anomalies detected. Your transactions look consistent.</p>
            </div>
        )
    }

    return (
        <div className="anomaly-list">
            {anomalies.map((a, i) => (
                <article
                    key={`${a.transaction.id}-${i}`}
                    className="anomaly-item"
                    style={{ '--stagger': i } as React.CSSProperties}
                >
                    <div className="anomaly-item__icon">
                        {a.deviation >= 4 ? '🚨' : '⚠️'}
                    </div>
                    <div className="anomaly-item__body">
                        <div className="anomaly-item__header">
                            <strong>{a.transaction.description}</strong>
                            <span className="anomaly-item__amount">
                                {formatCurrency(Math.abs(a.transaction.amount), currency)}
                            </span>
                        </div>
                        <p className="anomaly-item__reason">{a.reason}</p>
                        <small className="anomaly-item__date">{formatDate(a.transaction.date)}</small>
                    </div>
                    <div className="anomaly-item__badge">
                        {a.deviation.toFixed(1)}x
                    </div>
                </article>
            ))}
        </div>
    )
}
