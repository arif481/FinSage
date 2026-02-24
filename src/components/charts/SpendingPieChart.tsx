import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface SpendingPieChartItem {
  color: string
  label: string
  value: number
}

interface SpendingPieChartProps {
  data: SpendingPieChartItem[]
}

export const SpendingPieChart = ({ data }: SpendingPieChartProps) => {
  if (data.length === 0) {
    return <p className="chart-empty">No spending data yet.</p>
  }

  return (
    <div className="chart-shell" aria-label="Spending by category chart" role="img">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            stroke="transparent"
          >
            {data.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              color: 'var(--text)',
            }}
            formatter={(value: number | string | undefined) => {
              if (typeof value === 'number') {
                return value.toFixed(2)
              }

              return value ?? '0'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
