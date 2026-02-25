import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CashFlowItem } from '@/utils/finance'

interface CashFlowWaterfallProps {
    data: CashFlowItem[]
    currency?: string
}

export const CashFlowWaterfall = ({ data, currency = '' }: CashFlowWaterfallProps) => {
    if (data.length === 0) {
        return <p className="chart-empty">No cash flow data available.</p>
    }

    return (
        <div className="chart-shell" aria-label="Cash flow waterfall chart" role="img">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={60}
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
                        formatter={(value: number | string | undefined) => [
                            `${currency}${Number(value ?? 0).toFixed(2)}`,
                            'Amount',
                        ]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
                        {data.map((entry) => (
                            <Cell
                                key={entry.name}
                                fill={entry.fill}
                                style={{ filter: `drop-shadow(0 0 4px ${entry.fill})` }}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
