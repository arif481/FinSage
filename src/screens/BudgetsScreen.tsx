import { useState } from 'react'
import { BudgetRadarChart } from '@/components/charts/BudgetRadarChart'
import { BudgetPlanner } from '@/features/budgets/BudgetPlanner'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { upsertBudget } from '@/services/firestore/budgets'
import { budgetProgress } from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'
import { showToast } from '@/components/common/Toast'

export const BudgetsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, error, loading, transactions } = useFinanceCollections(user?.uid)
  const [month, setMonth] = useState(toMonthKey(new Date().toISOString()))
  const [saving, setSaving] = useState(false)

  const progress = budgetProgress(budgets, transactions, month)
  const totalLimit = progress.reduce((sum, item) => sum + item.limit, 0)
  const totalSpent = progress.reduce((sum, item) => sum + item.spent, 0)
  const overspentCount = progress.filter((item) => item.remaining < 0).length

  const handleSaveBudget = async (payload: {
    categoryId: string
    limit: number
    month: string
  }) => {
    if (!user) {
      return
    }

    setSaving(true)

    try {
      await upsertBudget(user.uid, payload)
      showToast('Budget saved successfully.', 'success')
    } finally {
      setSaving(false)
    }
  }

  const insightData = [
    { label: 'Total planned budget', value: formatCurrency(totalLimit, currency) },
    { label: 'Total spent', value: formatCurrency(totalSpent, currency) },
    { label: 'Remaining', value: formatCurrency(totalLimit - totalSpent, currency) },
    { label: 'Overspent categories', value: String(overspentCount) },
  ]

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
          <h2>Budget planner</h2>
          <p className="section-subtitle">
            Define category budgets and monitor usage in real time.
          </p>
        </div>
        <label className="field field--inline">
          <span>Month</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong style={{ color: i === 3 && overspentCount > 0 ? 'var(--danger)' : undefined }}>{item.value}</strong>
          </article>
        ))}
      </section>

      {/* Budget Radar Chart */}
      <section className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
        <div className="chart-header">
          <span className="chart-header__icon">🕸️</span>
          <h3>Budget Utilization Radar</h3>
        </div>
        <p className="section-subtitle">Visualize how each category's spending compares to its budget limit.</p>
        <BudgetRadarChart categories={categories} progress={progress} />
      </section>

      <BudgetPlanner
        budgets={budgets}
        categories={categories}
        currency={currency}
        month={month}
        progress={progress}
        saving={saving || loading}
        onSaveBudget={handleSaveBudget}
      />
    </main>
  )
}
