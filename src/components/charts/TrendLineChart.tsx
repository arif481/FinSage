import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface TrendLineChartPoint {
  expense: number
  income: number
  month: string
}

interface TrendLineChartProps {
  data: TrendLineChartPoint[]
}

export const TrendLineChart = ({ data }: TrendLineChartProps) => {
  if (data.length === 0) {
    return <p className="chart-empty">No monthly trend data available.</p>
  }

  return (
    <div className="chart-shell" aria-label="Income and expense trend chart" role="img">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              color: 'var(--text)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="var(--success)"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="var(--danger)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
