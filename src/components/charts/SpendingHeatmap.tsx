import { HeatmapCell } from '@/utils/finance'
import { formatCurrency } from '@/utils/format'

interface SpendingHeatmapProps {
    cells: HeatmapCell[]
    currency?: string
}

const INTENSITY_COLORS = [
    'color-mix(in srgb, var(--bg-strong) 100%, transparent)',
    'color-mix(in srgb, var(--primary) 20%, var(--bg-strong))',
    'color-mix(in srgb, var(--primary) 40%, var(--bg-strong))',
    'color-mix(in srgb, var(--primary) 65%, var(--bg-strong))',
    'color-mix(in srgb, var(--primary) 90%, var(--bg-strong))',
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const SpendingHeatmap = ({ cells, currency = 'USD' }: SpendingHeatmapProps) => {
    if (cells.length === 0) {
        return <p className="chart-empty">No spending data for heatmap.</p>
    }

    const maxWeek = Math.max(...cells.map((c) => c.week))

    return (
        <div className="heatmap" aria-label="Monthly spending heatmap" role="img">
            <div className="heatmap__labels">
                {DAY_LABELS.map((day) => (
                    <span key={day} className="heatmap__day-label">{day}</span>
                ))}
            </div>
            <div className="heatmap__grid" style={{ gridTemplateColumns: `repeat(${maxWeek + 1}, 1fr)` }}>
                {Array.from({ length: (maxWeek + 1) * 7 }, (_, i) => {
                    const week = Math.floor(i / 7)
                    const dayOfWeek = i % 7
                    const cell = cells.find((c) => c.week === week && c.dayOfWeek === dayOfWeek)

                    if (!cell) {
                        return <div key={i} className="heatmap__cell heatmap__cell--empty" />
                    }

                    return (
                        <div
                            key={cell.date}
                            className="heatmap__cell"
                            title={`${cell.date}: ${formatCurrency(cell.amount, currency)}`}
                            style={{
                                background: INTENSITY_COLORS[cell.intensity],
                                boxShadow: cell.intensity >= 3 ? `0 0 6px color-mix(in srgb, var(--primary) ${cell.intensity * 20}%, transparent)` : undefined,
                                animationDelay: `${i * 20}ms`,
                            }}
                        >
                            <span className="heatmap__cell-label">{cell.date.slice(8)}</span>
                        </div>
                    )
                })}
            </div>
            <div className="heatmap__legend">
                <span>Less</span>
                {INTENSITY_COLORS.map((color, i) => (
                    <div key={i} className="heatmap__legend-cell" style={{ background: color }} />
                ))}
                <span>More</span>
            </div>
        </div>
    )
}
