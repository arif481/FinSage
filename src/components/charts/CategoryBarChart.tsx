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
import { CategoryComparisonItem } from '@/utils/finance'

interface CategoryBarChartProps {
    data: CategoryComparisonItem[]
    currency?: string
}

export const CategoryBarChart = ({ data, currency = '' }: CategoryBarChartProps) => {
    if (data.length === 0) {
        return <p className="chart-empty">No category spending data yet.</p>
    }

    return (
        <div className="chart-shell" aria-label="Category spending comparison chart" role="img">
            <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
                <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
                    <XAxis
                        type="number"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            color: 'var(--text)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                        formatter={(value: number | string | undefined, _name: string | undefined, props: { payload?: CategoryComparisonItem }) => [
                            `${currency}${Number(value ?? 0).toFixed(2)} (${props.payload?.percentage ?? 0}%)`,
                            'Spent',
                        ]}
                    />
                    <Bar
                        dataKey="amount"
                        radius={[0, 6, 6, 0]}
                        animationDuration={1200}
                        barSize={24}
                    >
                        {data.map((entry) => (
                            <Cell
                                key={entry.name}
                                fill={entry.color}
                                style={{ filter: `drop-shadow(0 0 4px ${entry.color})` }}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
