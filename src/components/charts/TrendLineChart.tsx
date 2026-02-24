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
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#2f7f6d" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="expense" stroke="#ba4d37" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
