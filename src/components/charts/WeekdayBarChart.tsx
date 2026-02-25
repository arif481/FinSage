import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { WeekdaySpendingPoint } from '@/utils/finance'

interface WeekdayBarChartProps {
    data: WeekdaySpendingPoint[]
}

export const WeekdayBarChart = ({ data }: WeekdayBarChartProps) => {
    if (data.every((d) => d.amount === 0)) {
        return <p className="chart-empty">No weekday spending data available.</p>
    }

    const maxAmount = Math.max(...data.map((d) => d.amount))

    return (
        <div className="chart-shell" aria-label="Spending by day of week chart" role="img">
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                        dataKey="shortDay"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            color: 'var(--text)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number, _name: string, props: { payload: WeekdaySpendingPoint }) => [
                            `${(value ?? 0).toFixed(2)} (${props.payload.count} txns, avg: ${props.payload.average.toFixed(2)})`,
                            props.payload.day,
                        ]) as any}
                    />
                    <Bar
                        dataKey="amount"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1000}
                    >
                        {data.map((entry) => {
                            const ratio = maxAmount > 0 ? entry.amount / maxAmount : 0
                            const isWeekend = entry.shortDay === 'Sat' || entry.shortDay === 'Sun'
                            const color = isWeekend
                                ? `color-mix(in srgb, var(--warning) ${40 + ratio * 60}%, transparent)`
                                : `color-mix(in srgb, var(--primary) ${40 + ratio * 60}%, transparent)`
                            return (
                                <Cell
                                    key={entry.shortDay}
                                    fill={color}
                                    style={{ filter: ratio > 0.7 ? 'drop-shadow(0 0 4px var(--primary))' : undefined }}
                                />
                            )
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
