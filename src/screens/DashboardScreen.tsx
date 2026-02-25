import { Link } from 'react-router-dom'
import { CashFlowWaterfall } from '@/components/charts/CashFlowWaterfall'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { DailySpendingChart } from '@/components/charts/DailySpendingChart'
import { SmartInsightsPanel } from '@/components/charts/SmartInsightsPanel'
import { SpendingHeatmap } from '@/components/charts/SpendingHeatmap'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { SavingsGauge } from '@/components/charts/SavingsGauge'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { WeekdayBarChart } from '@/components/charts/WeekdayBarChart'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { MetricCard } from '@/components/common/MetricCard'
import { PredictiveForecastWidget } from '@/components/common/PredictiveForecastWidget'
import { FinancialHealthScore } from '@/components/smart/FinancialHealthScore'
import { MonthComparison } from '@/components/smart/MonthComparison'
import { SpendingAnomalies } from '@/components/smart/SpendingAnomalies'
import { StreakAchievements } from '@/components/smart/StreakAchievements'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
  budgetProgress,
  cashFlowWaterfall,
  categoryComparison,
  computeAchievements,
  computeHealthScore,
  dailySpending,
  detectAnomalies,
  generateSmartInsights,
  monthOverMonthComparison,
  monthlyTrend,
  netBalance,
  spendingByCategory,
  spendingHeatmap,
  totalExpenses,
  totalIncome,
  weekdayAnalysis,
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

  // Smart analytics
  const dailyData = dailySpending(transactions, currentMonth)
  const weekdayData = weekdayAnalysis(transactions)
  const heatmapCells = spendingHeatmap(transactions, currentMonth)
  const categoryBars = categoryComparison(transactions, categories)
  const smartInsights = generateSmartInsights(transactions, budgets, currentMonth)

  // Phase 2 smart features
  const healthScore = computeHealthScore(transactions, budgets, currentMonth)
  const anomalies = detectAnomalies(transactions)
  const monthComparison = monthOverMonthComparison(transactions, currentMonth)
  const achievements = computeAchievements(transactions, budgets, currentMonth)
  const cashFlow = cashFlowWaterfall(transactions, categories, currentMonth)

  const signals: Array<{ text: string; tone: 'good' | 'warning' | 'danger' | 'primary' }> = []

  if (currentBudgetLimit === 0) {
    signals.push({ text: 'Set at least one monthly budget to unlock overspending alerts.', tone: 'primary' })
  }
  if (overspentCategories.length > 0) {
    signals.push({ text: `${overspentCategories.length} categories are currently over budget.`, tone: 'danger' })
  }
  if (savingsRate !== null && savingsRate < 10) {
    signals.push({ text: 'Savings rate is below 10%. Consider reducing variable expenses.', tone: 'warning' })
  }
  if (signals.length === 0) {
    signals.push({ text: 'Budget and spending are stable. Keep logging for better forecasts.', tone: 'good' })
  }

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">Data access error: {error}. Confirm Firestore rules are deployed.</p>
      ) : null}

      <section className="hero-panel" style={{ animation: 'fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
        <div className="hero-panel__head">
          <div>
            <p className="kicker glow-text" style={{ animation: 'fade-up 400ms ease both 100ms' }}>Financial cockpit</p>
            <h2 style={{ animation: 'fade-up 400ms ease both 200ms' }}>Dashboard</h2>
            <p className="section-subtitle" style={{ animation: 'fade-up 400ms ease both 300ms' }}>Track spending, budgets, and trends at a glance.</p>
          </div>
          <div className="button-row" style={{ animation: 'fade-up 400ms ease both 400ms' }}>
            <Link className="secondary-button" to="/budgets">Set budget</Link>
            <Link className="primary-button" to="/transactions">Add expense</Link>
          </div>
        </div>
        <div className="hero-panel__meta">
          {[
            { label: 'Current month income', value: formatCurrency(currentMonthIncome, currency) },
            { label: 'Current month expense', value: formatCurrency(currentMonthExpenses, currency) },
            { label: 'Savings rate', value: savingsRate === null ? 'No income data' : `${Math.round(savingsRate)}%` },
            { label: 'Top spend category', value: topCategory ? topCategory.label : 'No data yet' },
          ].map((stat, i) => (
            <article key={stat.label} className="hero-stat" style={{ animation: `scale-pop 450ms cubic-bezier(0.16, 1, 0.3, 1) both ${300 + i * 80}ms` }}>
              <small>{stat.label}</small>
              <strong className="glow-text">{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* Financial Health Score */}
      <section className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🏥</span>
          <h3>Financial Health Score</h3>
        </div>
        <FinancialHealthScore result={healthScore} />
      </section>

      {/* Smart Insights */}
      <section style={{ '--stagger': 1 } as React.CSSProperties}>
        <h3 style={{ marginBottom: '0.5rem' }}>🧠 Smart Insights</h3>
        <SmartInsightsPanel insights={smartInsights} />
      </section>

      {/* Health Signals */}
      <section className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
        <h3>Health signals</h3>
        {signals.map((signal, i) => (
          <div key={signal.text} className="signal-item" style={{ animation: `fade-up 400ms ease both ${i * 100}ms` }}>
            <span className={`status-dot status-dot--${signal.tone}`} aria-hidden="true" />
            <p>{signal.text}</p>
          </div>
        ))}
      </section>

      <section className="metric-grid" aria-label="Key metrics">
        <MetricCard label="Net balance" value={formatCurrency(netBalance(transactions), currency)} subtitle="Income minus expenses" tone={netBalance(transactions) < 0 ? 'danger' : 'good'} stagger={0} />
        <MetricCard label="Month expenses" value={formatCurrency(currentMonthExpenses, currency)} subtitle={`Budget ${formatCurrency(currentBudgetLimit, currency)}`} tone={currentMonthExpenses > currentBudgetLimit && currentBudgetLimit > 0 ? 'warning' : 'neutral'} stagger={1} />
        <MetricCard label="Budget remaining" value={formatCurrency(totalRemaining, currency)} subtitle={progress.length > 0 ? `${progress.length} active categories` : 'No budgets set'} tone={totalRemaining < 0 ? 'danger' : 'good'} stagger={2} />
      </section>

      <PredictiveForecastWidget budgets={budgets} transactions={transactions} />

      {/* Month-over-Month + Cash Flow */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📅</span>
            <h3>Month vs Last Month</h3>
          </div>
          <MonthComparison data={monthComparison} currency={currency} />
        </div>
        <div className="card stack" style={{ '--stagger': 4 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">💸</span>
            <h3>Cash Flow Breakdown</h3>
          </div>
          <CashFlowWaterfall data={cashFlow} currency={currency} />
        </div>
      </section>

      {/* Savings Gauge + Daily Spending */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 5 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">💰</span>
            <h3>Savings Rate</h3>
          </div>
          <SavingsGauge income={currentMonthIncome} expenses={currentMonthExpenses} />
        </div>
        <div className="card stack" style={{ '--stagger': 6 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📈</span>
            <h3>Daily Spending Trend</h3>
          </div>
          <DailySpendingChart data={dailyData} currency={currency} />
        </div>
      </section>

      {/* Weekday + Heatmap */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 7 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📊</span>
            <h3>Spending by Day of Week</h3>
          </div>
          <WeekdayBarChart data={weekdayData} />
        </div>
        <div className="card stack" style={{ '--stagger': 8 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">🗓️</span>
            <h3>Spending Heatmap</h3>
          </div>
          <SpendingHeatmap cells={heatmapCells} currency={currency} />
        </div>
      </section>

      {/* Pie + Category Bar */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 9 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📋</span>
            <h3>Spending by Category</h3>
          </div>
          <SpendingPieChart data={pieData} />
        </div>
        <div className="card stack" style={{ '--stagger': 10 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📊</span>
            <h3>Category Comparison</h3>
          </div>
          <CategoryBarChart data={categoryBars} currency={currency} />
        </div>
      </section>

      {/* Anomaly Detection */}
      <section className="card stack" style={{ '--stagger': 11 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🔍</span>
          <h3>Spending Anomalies</h3>
        </div>
        <p className="section-subtitle">Transactions significantly above their category average.</p>
        <SpendingAnomalies anomalies={anomalies} currency={currency} />
      </section>

      {/* Achievements */}
      <section className="card stack" style={{ '--stagger': 12 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🏅</span>
          <h3>Achievements</h3>
        </div>
        <StreakAchievements achievements={achievements} />
      </section>

      {/* Recent Transactions + Monthly Trend */}
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 13 } as React.CSSProperties}>
          <h3>Recent transactions</h3>
          {transactions.slice(0, 5).map((transaction, i) => (
            <article key={transaction.id} className="list-row" style={{ animation: `fade-up 350ms ease both ${i * 60}ms` }}>
              <div>
                <strong>{transaction.description}</strong>
                <small>{formatDate(transaction.date)}</small>
              </div>
              <span className={transaction.type === 'expense' ? 'amount--expense' : 'amount--income'} style={{ fontWeight: 800 }}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount, currency)}
              </span>
            </article>
          ))}
          {transactions.length === 0 ? <p className="empty-state">No data yet - click Add expense.</p> : null}
        </div>
        <div className="card stack" style={{ '--stagger': 14 } as React.CSSProperties}>
          <h3>Monthly trend</h3>
          <TrendLineChart data={trendData} />
        </div>
      </section>
    </main>
  )
}
