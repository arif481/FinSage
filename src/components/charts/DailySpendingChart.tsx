import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { DailySpendingPoint } from '@/utils/finance'

interface DailySpendingChartProps {
    data: DailySpendingPoint[]
    currency?: string
}

export const DailySpendingChart = ({ data, currency = '' }: DailySpendingChartProps) => {
    if (data.length === 0) {
        return <p className="chart-empty">No daily spending data this month.</p>
    }

    return (
        <div className="chart-shell" aria-label="Daily spending trend chart" role="img">
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <defs>
                        <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                    <XAxis
                        dataKey="label"
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
                        formatter={(value: number | string | undefined, name: string | undefined) => [
                            `${currency}${Number(value ?? 0).toFixed(2)}`,
                            name === 'amount' ? 'Daily' : 'Cumulative',
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        fill="url(#dailyGradient)"
                        style={{ filter: 'drop-shadow(0 0 6px var(--primary))' }}
                        animationDuration={1200}
                    />
                    <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="var(--warning)"
                        strokeWidth={2}
                        fill="url(#cumulativeGradient)"
                        strokeDasharray="6 3"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
