import { useState } from 'react'
import { CashFlowWaterfall } from '@/components/charts/CashFlowWaterfall'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { CategoryTreemap } from '@/components/charts/CategoryTreemap'
import { DailySpendingChart } from '@/components/charts/DailySpendingChart'
import { NetWorthProjection } from '@/components/charts/NetWorthProjection'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { SpendingHeatmap } from '@/components/charts/SpendingHeatmap'
import { SpendingVelocityGauge } from '@/components/charts/SpendingVelocityGauge'
import { TransactionScatterPlot } from '@/components/charts/TransactionScatterPlot'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { WeekdayBarChart } from '@/components/charts/WeekdayBarChart'
import { SavingsGauge } from '@/components/charts/SavingsGauge'
import { SmartInsightsPanel } from '@/components/charts/SmartInsightsPanel'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { FinancialHealthScore } from '@/components/smart/FinancialHealthScore'
import { MonthComparison } from '@/components/smart/MonthComparison'
import { SpendingAnomalies } from '@/components/smart/SpendingAnomalies'
import { StreakAchievements } from '@/components/smart/StreakAchievements'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import {
  cashFlowWaterfall,
  categoryComparison,
  categoryTreemapData,
  computeAchievements,
  computeHealthScore,
  dailySpending,
  detectAnomalies,
  generateSmartInsights,
  monthOverMonthComparison,
  monthlyTrend,
  netWorthProjectionData,
  spendingByCategory,
  spendingHeatmap,
  totalExpenses,
  totalIncome,
  transactionScatterData,
  velocityGaugeData,
  weekdayAnalysis,
} from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'

type ReportTab = 'overview' | 'trends' | 'categories' | 'smart'

const tabConfig: { key: ReportTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'trends', label: 'Trends', icon: '📈' },
  { key: 'categories', label: 'Categories', icon: '🗂️' },
  { key: 'smart', label: 'Smart', icon: '🏅' },
]

export const ReportsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, error, loading, transactions } = useFinanceCollections(user?.uid)
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const [selectedMonth, setSelectedMonth] = useState(toMonthKey(new Date().toISOString()))

  if (loading) {
    return <LoadingScreen label="Building your reports..." />
  }

  const currentMonth = selectedMonth
  const trendData = monthlyTrend(transactions)
  const categoryData = spendingByCategory(transactions)
    .map((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId)
      return { color: category?.color ?? '#8f95a1', label: category?.name ?? 'Other', value: item.amount }
    })
    .sort((a, b) => b.value - a.value)

  const topCategory = categoryData[0]
  const latestMonth = trendData.at(-1)
  const previousMonth = trendData.at(-2)
  const expenseDelta = latestMonth && previousMonth ? latestMonth.expense - previousMonth.expense : null
  const monthExpenses = totalExpenses(transactions.filter((t) => toMonthKey(t.date) === currentMonth))
  const monthIncome = totalIncome(transactions.filter((t) => toMonthKey(t.date) === currentMonth))

  const insightData = [
    { label: 'Tracked months', value: String(trendData.length) },
    { label: 'Top category', value: topCategory ? topCategory.label : 'No data yet' },
    { label: 'Month expense', value: formatCurrency(monthExpenses, currency) },
    { label: 'Month income', value: formatCurrency(monthIncome, currency) },
  ]

  const insightLines: Array<{ text: string; tone: 'good' | 'warning' | 'danger' | 'primary' }> = []
  if (topCategory) {
    insightLines.push({ text: `Highest spending category is ${topCategory.label} (${formatCurrency(topCategory.value, currency)}).`, tone: 'primary' })
  }
  if (expenseDelta !== null) {
    const direction = expenseDelta > 0 ? 'up' : 'down'
    insightLines.push({ text: `Monthly expenses are ${direction} by ${formatCurrency(Math.abs(expenseDelta), currency)} vs previous month.`, tone: expenseDelta > 0 ? 'warning' : 'good' })
  }
  if (trendData.length < 2) {
    insightLines.push({ text: 'Keep logging transactions for stronger month-over-month insights.', tone: 'primary' })
  }

  return (
    <main className="screen stack">
      {error ? <p className="error-text">Data access error: {error}.</p> : null}

      <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
        <div>
          <h2>Insights and analytics</h2>
          <p className="section-subtitle">Deep dive into financial vectors and future trends.</p>
        </div>
        <label className="field field--inline">
          <span>Month</span>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </label>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {/* Tab bar */}
      <nav style={{
        display: 'flex',
        gap: '0.25rem',
        background: 'var(--bg-elevated)',
        borderRadius: '0.75rem',
        padding: '0.25rem',
        overflow: 'auto',
      }}>
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.9rem',
              background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="stack" style={{ animation: 'fade-up 300ms ease both' }}>
          <OverviewTab
            transactions={transactions}
            budgets={budgets}
            categories={categories}
            currentMonth={currentMonth}
            currency={currency}
            monthIncome={monthIncome}
            monthExpenses={monthExpenses}
          />
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="stack" style={{ animation: 'fade-up 300ms ease both' }}>
          <TrendsTab
            transactions={transactions}
            trendData={trendData}
            currentMonth={currentMonth}
            currency={currency}
          />
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="stack" style={{ animation: 'fade-up 300ms ease both' }}>
          <CategoriesTab
            transactions={transactions}
            categories={categories}
            categoryData={categoryData}
            currentMonth={currentMonth}
            currency={currency}
          />
        </div>
      )}

      {/* Smart Tab */}
      {activeTab === 'smart' && (
        <div className="stack" style={{ animation: 'fade-up 300ms ease both' }}>
          <SmartTab
            transactions={transactions}
            budgets={budgets}
            categories={categories}
            currentMonth={currentMonth}
            currency={currency}
          />
        </div>
      )}

      {/* Summary (always visible) */}
      <section className="card stack" style={{ '--stagger': 16 } as React.CSSProperties}>
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

/* ── Sub-Components for each tab ── */

import { Budget, Category, FinanceTransaction } from '@/types/finance'
import { MonthlyTrendPoint } from '@/utils/finance'

const OverviewTab = ({ transactions, budgets, categories, currentMonth, currency, monthIncome, monthExpenses }: {
  transactions: FinanceTransaction[]
  budgets: Budget[]
  categories: Category[]
  currentMonth: string
  currency: string
  monthIncome: number
  monthExpenses: number
}) => {
  const healthScore = computeHealthScore(transactions, budgets, currentMonth)
  const velocityData = velocityGaugeData(transactions, budgets, currentMonth)
  const monthComparison = monthOverMonthComparison(transactions, currentMonth)
  const cashFlow = cashFlowWaterfall(transactions, categories, currentMonth)
  const netWorthData = netWorthProjectionData(transactions)
  const smartInsights = generateSmartInsights(transactions, budgets, currentMonth)

  return (
    <>
      <section className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🏥</span>
          <h3>Financial Health Score</h3>
        </div>
        <FinancialHealthScore result={healthScore} />
      </section>

      <section>
        <h3 style={{ marginBottom: '0.5rem' }}>🧠 Smart Insights</h3>
        <SmartInsightsPanel insights={smartInsights} />
      </section>

      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">⏱️</span>
            <h3>Spending Velocity</h3>
          </div>
          <SpendingVelocityGauge data={velocityData} currency={currency} />
        </div>
        <div className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">💰</span>
            <h3>Savings Rate</h3>
          </div>
          <SavingsGauge income={monthIncome} expenses={monthExpenses} />
        </div>
      </section>

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

      <section className="card stack" style={{ '--stagger': 5 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🚀</span>
          <h3>Net Worth Projection</h3>
        </div>
        <NetWorthProjection data={netWorthData} currency={currency} />
      </section>
    </>
  )
}

const TrendsTab = ({ transactions, trendData, currentMonth, currency }: {
  transactions: FinanceTransaction[]
  trendData: MonthlyTrendPoint[]
  currentMonth: string
  currency: string
}) => {
  const dailyData = dailySpending(transactions, currentMonth)
  const weekdayData = weekdayAnalysis(transactions)
  const heatmapCells = spendingHeatmap(transactions, currentMonth)

  return (
    <>
      <section className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">📉</span>
          <h3>Historical Monthly Trend</h3>
        </div>
        <TrendLineChart data={trendData} />
      </section>

      <section className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">📈</span>
          <h3>Daily Spending Trend</h3>
        </div>
        <DailySpendingChart data={dailyData} currency={currency} />
      </section>

      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📊</span>
            <h3>Spending by Day of Week</h3>
          </div>
          <WeekdayBarChart data={weekdayData} />
        </div>
        <div className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">🗓️</span>
            <h3>Spending Heatmap</h3>
          </div>
          <SpendingHeatmap cells={heatmapCells} currency={currency} />
        </div>
      </section>
    </>
  )
}

const CategoriesTab = ({ transactions, categories, categoryData, currentMonth, currency }: {
  transactions: FinanceTransaction[]
  categories: Category[]
  categoryData: { color: string; label: string; value: number }[]
  currentMonth: string
  currency: string
}) => {
  const categoryBars = categoryComparison(transactions, categories)
  const treemapData = categoryTreemapData(transactions, categories, currentMonth)
  const scatterData = transactionScatterData(transactions, categories, currentMonth)

  return (
    <>
      <section className="grid-two">
        <div className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">🍩</span>
            <h3>Spending Share</h3>
          </div>
          <SpendingPieChart data={categoryData} />
        </div>
        <div className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
          <div className="chart-header">
            <span className="chart-header__icon">📊</span>
            <h3>Category Comparison</h3>
          </div>
          <CategoryBarChart data={categoryBars} currency={currency} />
        </div>
      </section>

      <section className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">📦</span>
          <h3>Category Hierarchy Map</h3>
        </div>
        <CategoryTreemap data={treemapData} currency={currency} />
      </section>

      <section className="card stack" style={{ '--stagger': 3 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">📍</span>
          <h3>Transaction Density / Timetable</h3>
        </div>
        <TransactionScatterPlot data={scatterData} currency={currency} />
      </section>
    </>
  )
}

const SmartTab = ({ transactions, budgets, categories, currentMonth, currency }: {
  transactions: FinanceTransaction[]
  budgets: Budget[]
  categories: Category[]
  currentMonth: string
  currency: string
}) => {
  const anomalies = detectAnomalies(transactions)
  const achievements = computeAchievements(transactions, budgets, currentMonth)

  void categories
  void currency

  return (
    <>
      <section className="card stack" style={{ '--stagger': 0 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🔍</span>
          <h3>Spending Anomalies</h3>
        </div>
        <SpendingAnomalies anomalies={anomalies} currency={currency} />
      </section>

      <section className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🏅</span>
          <h3>Achievements</h3>
        </div>
        <StreakAchievements achievements={achievements} />
      </section>
    </>
  )
}
