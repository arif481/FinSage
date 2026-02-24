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

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you are signed in.
        </p>
      ) : null}
      <header className="screen-header">
        <div>
          <h2>Insights and reports</h2>
          <p className="section-subtitle">Analyze trends and detect over-spending categories quickly.</p>
        </div>
      </header>

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
        {topCategory ? (
          <p>
            Highest spending category: <strong>{topCategory.label}</strong> at{' '}
            <strong>{formatCurrency(topCategory.value, currency)}</strong>.
          </p>
        ) : (
          <p>No spending data yet.</p>
        )}

        <p>
          {trendData.length > 1
            ? `You have ${trendData.length} months of trend data available for comparison.`
            : 'Add more transactions to unlock month-over-month insights.'}
        </p>
      </section>
    </main>
  )
}
