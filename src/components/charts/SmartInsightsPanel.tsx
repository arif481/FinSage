import { SmartInsight } from '@/utils/finance'

interface SmartInsightsPanelProps {
    insights: SmartInsight[]
}

export const SmartInsightsPanel = ({ insights }: SmartInsightsPanelProps) => {
    if (insights.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</p>
                <p className="empty-state">Add transactions to unlock smart insights.</p>
            </div>
        )
    }

    return (
        <div className="insights-grid">
            {insights.map((insight, i) => (
                <article
                    key={insight.id}
                    className={`insight-card insight-card--${insight.tone}`}
                    style={{ '--stagger': i } as React.CSSProperties}
                >
                    <div className="insight-card__header">
                        <span className="insight-card__icon">{insight.icon}</span>
                        <div>
                            <h4 className="insight-card__title">{insight.title}</h4>
                            {insight.value ? (
                                <span className={`insight-card__value insight-card__value--${insight.tone}`}>
                                    {insight.value}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <p className="insight-card__description">{insight.description}</p>
                    <div className="insight-card__accent" />
                </article>
            ))}
        </div>
    )
}
