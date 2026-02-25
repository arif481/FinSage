import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { NetWorthPoint } from '@/utils/finance'

interface NetWorthProjectionProps {
    data: NetWorthPoint[]
    currency: string
}

export const NetWorthProjection = ({ data, currency }: NetWorthProjectionProps) => {
    if (data.length === 0) {
        return <p className="chart-empty">Need more history to project net worth.</p>
    }

    return (
        <div className="chart-shell" aria-label="6-month net worth projection" role="img">
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="month"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            color: 'var(--text)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                        formatter={(value: number | string | undefined) => [
                            `${currency}${Number(value ?? 0).toLocaleString()}`,
                            'Projected',
                        ]}
                    />
                    <Line
                        type="monotone"
                        dataKey="projected"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: 'var(--bg-panel)', stroke: 'var(--primary)', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--bg-panel)' }}
                        animationDuration={1500}
                        style={{ filter: 'drop-shadow(0 4px 6px color-mix(in srgb, var(--primary) 30%, transparent))' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
