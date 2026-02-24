import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { monthlyTrend, spendingByCategory } from '@/utils/finance'
import { formatCurrency } from '@/utils/format'

export const ReportsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { categories, error, loading, transactions } = useFinanceCollections(user?.uid)

  if (loading) {
    return <LoadingScreen label="Building your reports..." />
  }

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

  const insightLines: string[] = []

  if (topCategory) {
    insightLines.push(
      `Highest spending category is ${topCategory.label} (${formatCurrency(topCategory.value, currency)}).`,
    )
  }

  if (expenseDelta !== null) {
    const direction = expenseDelta > 0 ? 'up' : 'down'
    insightLines.push(
      `Monthly expenses are ${direction} by ${formatCurrency(Math.abs(expenseDelta), currency)} versus previous month.`,
    )
  }

  if (trendData.length < 2) {
    insightLines.push('Keep logging transactions for stronger month-over-month insights.')
  }

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you
          are signed in.
        </p>
      ) : null}
      <header className="screen-header">
        <div>
          <h2>Insights and reports</h2>
          <p className="section-subtitle">
            Analyze trends and detect over-spending categories quickly.
          </p>
        </div>
      </header>

      <section className="insight-strip">
        <article className="insight-strip__item">
          <small>Tracked months</small>
          <strong>{trendData.length}</strong>
        </article>
        <article className="insight-strip__item">
          <small>Top category</small>
          <strong>{topCategory ? topCategory.label : 'No data yet'}</strong>
        </article>
        <article className="insight-strip__item">
          <small>Latest month expense</small>
          <strong>{formatCurrency(latestMonth?.expense ?? 0, currency)}</strong>
        </article>
        <article className="insight-strip__item">
          <small>Latest month income</small>
          <strong>{formatCurrency(latestMonth?.income ?? 0, currency)}</strong>
        </article>
      </section>

      <section className="grid-two">
        <div className="card stack">
          <h3>Spending share</h3>
          <SpendingPieChart data={categoryData} />
        </div>

        <div className="card stack">
          <h3>Monthly trend</h3>
          <TrendLineChart data={trendData} />
        </div>
      </section>

      <section className="card stack">
        <h3>Summary</h3>
        {insightLines.map((line) => (
          <div key={line} className="signal-item">
            <span className="signal-item__dot" aria-hidden="true" />
            <p>{line}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
