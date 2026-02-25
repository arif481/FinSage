import { MonthComparisonItem } from '@/utils/finance'
import { formatCurrency } from '@/utils/format'

interface MonthComparisonProps {
    data: MonthComparisonItem[]
    currency: string
}

export const MonthComparison = ({ data, currency }: MonthComparisonProps) => {
    if (data.every((d) => d.current === 0 && d.previous === 0)) {
        return <p className="chart-empty">Not enough data for month comparison.</p>
    }

    return (
        <div className="month-comparison">
            {data.map((item, i) => {
                const max = Math.max(item.current, item.previous, 1)
                const isUp = item.change > 0
                const isMoney = item.label !== 'Transactions'
                const displayCurrent = isMoney ? formatCurrency(item.current, currency) : String(item.current)
                const displayPrevious = isMoney ? formatCurrency(item.previous, currency) : String(item.previous)

                return (
                    <div
                        key={item.label}
                        className="month-comparison__row"
                        style={{ '--stagger': i } as React.CSSProperties}
                    >
                        <div className="month-comparison__label">
                            <strong>{item.label}</strong>
                            <span className={`month-comparison__change ${isUp ? (item.label === 'Total Expenses' ? 'month-comparison__change--danger' : 'month-comparison__change--good') : (item.label === 'Total Expenses' ? 'month-comparison__change--good' : 'month-comparison__change--danger')}`}>
                                {isUp ? '↑' : '↓'} {Math.abs(item.changePct)}%
                            </span>
                        </div>
                        <div className="month-comparison__bars">
                            <div className="month-comparison__bar-row">
                                <span className="month-comparison__bar-label">This month</span>
                                <div className="month-comparison__bar-track">
                                    <div
                                        className="month-comparison__bar month-comparison__bar--current"
                                        style={{ width: `${(item.current / max) * 100}%` }}
                                    />
                                </div>
                                <span className="month-comparison__bar-value">{displayCurrent}</span>
                            </div>
                            <div className="month-comparison__bar-row">
                                <span className="month-comparison__bar-label">Last month</span>
                                <div className="month-comparison__bar-track">
                                    <div
                                        className="month-comparison__bar month-comparison__bar--previous"
                                        style={{ width: `${(item.previous / max) * 100}%` }}
                                    />
                                </div>
                                <span className="month-comparison__bar-value">{displayPrevious}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
