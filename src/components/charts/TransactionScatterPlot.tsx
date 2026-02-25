import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ScatterPoint } from '@/utils/finance'

interface TransactionScatterPlotProps {
    data: ScatterPoint[]
    currency: string
}

export const TransactionScatterPlot = ({ data, currency }: TransactionScatterPlotProps) => {
    if (data.length === 0) {
        return <p className="chart-empty">No transactions to map.</p>
    }

    // Find max day for X-axis domain mapping
    const maxDay = Math.max(30, ...data.map(d => d.day))

    return (
        <div className="chart-shell" aria-label="Transaction Scatter Plot" role="img">
            <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />

                    <XAxis
                        type="number"
                        dataKey="day"
                        name="Day of Month"
                        domain={[1, maxDay]}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={false}
                    />

                    <YAxis
                        type="number"
                        dataKey="amount"
                        name="Amount"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={false}
                        tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                    />

                    {/* ZAxis handles dot sizing automatically in Recharts based on data properties if mapped, 
                    but just using a static size is safer here to avoid overlapping mess. */}
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            color: 'var(--text)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                        formatter={(value: number | string | undefined, name: string | number | undefined, props: any) => {
                            if (name === 'Day of Month') return [`Day ${value}`, 'Date']
                            if (name === 'Amount') return [`${currency}${Number(value ?? 0).toLocaleString()}`, props.payload.categoryName]
                            return [value, name]
                        }}
                    />

                    <Scatter name="Transactions" data={data} animationDuration={1000}>
                        {data.map((entry, index) => {
                            const color = entry.type === 'income' ? 'var(--success)' : 'var(--danger)';

                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={color}
                                    fillOpacity={0.6}
                                    stroke={color}
                                    strokeWidth={1.5}
                                />
                            )
                        })}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    )
}
