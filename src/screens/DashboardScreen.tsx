import { Link } from 'react-router-dom'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { MetricCard } from '@/components/common/MetricCard'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
  budgetProgress,
  monthlyTrend,
  netBalance,
  spendingByCategory,
  totalExpenses,
  totalIncome,
} from '@/utils/finance'
import { formatCurrency, formatDate, toMonthKey } from '@/utils/format'

export const DashboardScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, error, loading, transactions } = useFinanceCollections(user?.uid)

  if (loading) {
    return <LoadingScreen />
  }

  const currentMonth = toMonthKey(new Date().toISOString())
  const monthTransactions = transactions.filter(
    (transaction) => toMonthKey(transaction.date) === currentMonth,
  )
  const currentMonthExpenses = totalExpenses(monthTransactions)
  const currentMonthIncome = totalIncome(monthTransactions)
  const currentBudgetLimit = budgets
    .filter((budget) => budget.month === currentMonth)
    .reduce((sum, budget) => sum + budget.limit, 0)

  const progress = budgetProgress(budgets, transactions, currentMonth)
  const totalRemaining = progress.reduce((sum, item) => sum + item.remaining, 0)
  const overspentCategories = progress.filter((item) => item.remaining < 0)
  const pieData = spendingByCategory(transactions)
    .map((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId)

      return {
        color: category?.color ?? '#8f95a1',
        label: category?.name ?? 'Other',
        value: item.amount,
      }
    })
    .sort((a, b) => b.value - a.value)
  const trendData = monthlyTrend(transactions)
  const savingsRate =
    currentMonthIncome > 0
      ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100
      : null
  const topCategory = pieData[0]

  const signals: string[] = []

  if (currentBudgetLimit === 0) {
    signals.push('Set at least one monthly budget category to unlock overspending alerts.')
  }

  if (overspentCategories.length > 0) {
    signals.push(`${overspentCategories.length} categories are currently over budget.`)
  }

  if (savingsRate !== null && savingsRate < 10) {
    signals.push('Savings rate is below 10%. Consider reducing variable expenses this week.')
  }

  if (signals.length === 0) {
    signals.push('Budget and spending are stable. Keep logging transactions for better forecasts.')
  }

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you
          are signed in.
        </p>
      ) : null}

      <section className="hero-panel">
        <div className="hero-panel__head">
          <div>
            <p className="kicker">Financial cockpit</p>
            <h2>Dashboard</h2>
            <p className="section-subtitle">Track spending, budgets, and trends at a glance.</p>
          </div>
          <div className="button-row">
            <Link className="secondary-button" to="/budgets">
              Set budget
            </Link>
            <Link className="primary-button" to="/transactions">
              Add expense
            </Link>
          </div>
        </div>

        <div className="hero-panel__meta">
          <article className="hero-stat">
            <small>Current month income</small>
            <strong>{formatCurrency(currentMonthIncome, currency)}</strong>
          </article>
          <article className="hero-stat">
            <small>Current month expense</small>
            <strong>{formatCurrency(currentMonthExpenses, currency)}</strong>
          </article>
          <article className="hero-stat">
            <small>Savings rate</small>
            <strong>
              {savingsRate === null ? 'No income data' : `${Math.round(savingsRate)}%`}
            </strong>
          </article>
          <article className="hero-stat">
            <small>Top spend category</small>
            <strong>{topCategory ? topCategory.label : 'No data yet'}</strong>
          </article>
        </div>
      </section>

      <header className="screen-header">
        <div>
          <h3>Health signals</h3>
          <p className="section-subtitle">
            Actionable checkpoints generated from your current month activity.
          </p>
        </div>
      </header>

      <section className="card stack">
        {signals.map((signal) => (
          <div key={signal} className="signal-item">
            <span className="signal-item__dot" aria-hidden="true" />
            <p>{signal}</p>
          </div>
        ))}
      </section>

      <section className="metric-grid" aria-label="Key metrics">
        <MetricCard
          label="Net balance"
          value={formatCurrency(netBalance(transactions), currency)}
          subtitle="Income minus expenses"
          tone={netBalance(transactions) < 0 ? 'danger' : 'good'}
        />
        <MetricCard
          label="Month expenses"
          value={formatCurrency(currentMonthExpenses, currency)}
          subtitle={`Budget ${formatCurrency(currentBudgetLimit, currency)}`}
          tone={
            currentMonthExpenses > currentBudgetLimit && currentBudgetLimit > 0
              ? 'warning'
              : 'neutral'
          }
        />
        <MetricCard
          label="Budget remaining"
          value={formatCurrency(totalRemaining, currency)}
          subtitle={progress.length > 0 ? `${progress.length} active categories` : 'No budgets set'}
          tone={totalRemaining < 0 ? 'danger' : 'good'}
        />
      </section>

      <section className="grid-two">
        <div className="card stack">
          <h3>Spending by category</h3>
          <SpendingPieChart data={pieData} />
        </div>

        <div className="card stack">
          <h3>Recent transactions</h3>
          {transactions.slice(0, 5).map((transaction) => (
            <article key={transaction.id} className="list-row">
              <div>
                <strong>{transaction.description}</strong>
                <small>{formatDate(transaction.date)}</small>
              </div>
              <span
                className={transaction.type === 'expense' ? 'amount--expense' : 'amount--income'}
              >
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount, currency)}
              </span>
            </article>
          ))}
          {transactions.length === 0 ? (
            <p className="empty-state">No data yet - click Add expense.</p>
          ) : null}
        </div>
      </section>

      <section className="card stack">
        <h3>Monthly trend</h3>
        <TrendLineChart data={trendData} />
      </section>
    </main>
  )
}
