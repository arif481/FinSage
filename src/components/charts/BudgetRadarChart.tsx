import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { BudgetProgress, Category } from '@/types/finance'

interface BudgetRadarChartProps {
    categories: Category[]
    progress: BudgetProgress[]
}

export const BudgetRadarChart = ({ categories, progress }: BudgetRadarChartProps) => {
    if (progress.length === 0) {
        return <p className="chart-empty">Set budgets to see the radar overview.</p>
    }

    const data = progress.map((item) => {
        const cat = categories.find((c) => c.id === item.categoryId)
        return {
            category: cat?.name ?? 'Other',
            usage: Math.min(Math.round(item.percent), 150),
            fullMark: 100,
        }
    })

    return (
        <div className="chart-shell" aria-label="Budget utilization radar chart" role="img">
            <ResponsiveContainer width="100%" height={320}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid
                        stroke="var(--border)"
                        strokeOpacity={0.5}
                    />
                    <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                        axisLine={false}
                    />
                    <Radar
                        name="Budget Usage %"
                        dataKey="usage"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.2}
                        strokeWidth={2.5}
                        animationDuration={1200}
                        style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            color: 'var(--text)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number) => [`${value ?? 0}%`, 'Usage']) as any}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}
