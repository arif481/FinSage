import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { DailySpendingChart } from '@/components/charts/DailySpendingChart'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { SpendingHeatmap } from '@/components/charts/SpendingHeatmap'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { WeekdayBarChart } from '@/components/charts/WeekdayBarChart'
import { SavingsGauge } from '@/components/charts/SavingsGauge'
import { SmartInsightsPanel } from '@/components/charts/SmartInsightsPanel'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
  categoryComparison,
  dailySpending,
  generateSmartInsights,
  monthlyTrend,
  spendingByCategory,
  spendingHeatmap,
  totalExpenses,
  totalIncome,
  weekdayAnalysis,
} from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'

export const ReportsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, error, loading, transactions } = useFinanceCollections(user?.uid)

  if (loading) {
    return <LoadingScreen label="Building your reports..." />
  }

  const currentMonth = toMonthKey(new Date().toISOString())
  const trendData = monthlyTrend(transactions)
  const categoryData = spendingByCategory(transactions)
    .map((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId)

      return {
        color: category?.color ?? '#8f95a1',
        label: category?.name ?? 'Other',
        value: item.amount,
      }
    })
    .sort((a, b) => b.value - a.value)

  const topCategory = categoryData[0]
  const latestMonth = trendData.at(-1)
  const previousMonth = trendData.at(-2)
  const expenseDelta =
    latestMonth && previousMonth ? latestMonth.expense - previousMonth.expense : null

  // Smart data
  const dailyData = dailySpending(transactions, currentMonth)
  const weekdayData = weekdayAnalysis(transactions)
  const heatmapCells = spendingHeatmap(transactions, currentMonth)
  const categoryBars = categoryComparison(transactions, categories)
  const smartInsights = generateSmartInsights(transactions, budgets, currentMonth)
  const monthExpenses = totalExpenses(transactions.filter((t) => toMonthKey(t.date) === currentMonth))
  const monthIncome = totalIncome(transactions.filter((t) => toMonthKey(t.date) === currentMonth))

  const insightData = [
    { label: 'Tracked months', value: String(trendData.length) },
    { label: 'Top category', value: topCategory ? topCategory.label : 'No data yet' },
    { label: 'Latest month expense', value: formatCurrency(latestMonth?.expense ?? 0, currency) },
    { label: 'Latest month income', value: formatCurrency(latestMonth?.income ?? 0, currency) },
  ]

  const insightLines: Array<{ text: string; tone: 'good' | 'warning' | 'danger' | 'primary' }> = []

  if (topCategory) {
    insightLines.push({
      text: `Highest spending category is ${topCategory.label} (${formatCurrency(topCategory.value, currency)}).`,
      tone: 'primary',
    })
  }

  if (expenseDelta !== null) {
    const direction = expenseDelta > 0 ? 'up' : 'down'
    insightLines.push({
      text: `Monthly expenses are ${direction} by ${formatCurrency(Math.abs(expenseDelta), currency)} versus previous month.`,
      tone: expenseDelta > 0 ? 'warning' : 'good',
    })
  }

  if (trendData.length < 2) {
    insightLines.push({ text: 'Keep logging transactions for stronger month-over-month insights.', tone: 'primary' })
  }

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you
          are signed in.
        </p>
      ) : null}
      <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
        <div>
          <h2>Insights and reports</h2>
          <p className="section-subtitle">
            Analyze trends and detect over-spending categories quickly.
          </p>
        </div>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {/* Smart Insights */}
      <section>
        <h3 style={{ marginBottom: '0.5rem' }}>🧠 Smart Insights</h3>
        <SmartInsightsPanel insights={smartInsights} />
      </section>

      {/* Savings + Daily Spending */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">💰</span>
            <h3>Savings Rate</h3>
          </div>
          <SavingsGauge income={monthIncome} expenses={monthExpenses} />
        </div>

        <div className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📈</span>
            <h3>Daily Spending Trend</h3>
          </div>
          <DailySpendingChart data={dailyData} currency={currency} />
        </div>
      </section>

      {/* Pie + Category Bar */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">🍩</span>
            <h3>Spending Share</h3>
          </div>
          <SpendingPieChart data={categoryData} />
        </div>

        <div className="card stack" style={{ '--stagger': 4 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📊</span>
            <h3>Category Comparison</h3>
          </div>
          <CategoryBarChart data={categoryBars} currency={currency} />
        </div>
      </section>

      {/* Weekday + Heatmap */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 5 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📊</span>
            <h3>Spending by Day of Week</h3>
          </div>
          <WeekdayBarChart data={weekdayData} />
        </div>

        <div className="card stack" style={{ '--stagger': 6 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">🗓️</span>
            <h3>Spending Heatmap</h3>
          </div>
          <SpendingHeatmap cells={heatmapCells} currency={currency} />
        </div>
      </section>

      {/* Monthly Trend */}
      <section className="card stack" style={{ '--stagger': 7 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">📉</span>
          <h3>Monthly trend</h3>
        </div>
        <TrendLineChart data={trendData} />
      </section>

      <section className="card stack" style={{ '--stagger': 8 } as React.CSSProperties}>
        <h3>Summary</h3>
        {insightLines.map((line, i) => (
          <div key={line.text} className="signal-item" style={{ animation: `fade-up 400ms ease both ${i * 100}ms` }}>
            <span className={`status-dot status-dot--${line.tone}`} aria-hidden="true" />
            <p>{line.text}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
