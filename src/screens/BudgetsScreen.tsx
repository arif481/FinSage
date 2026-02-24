import { useState } from 'react'
import { BudgetPlanner } from '@/features/budgets/BudgetPlanner'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { upsertBudget } from '@/services/firestore/budgets'
import { budgetProgress } from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'

export const BudgetsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, error, loading, transactions } = useFinanceCollections(user?.uid)
  const [month, setMonth] = useState(toMonthKey(new Date().toISOString()))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

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
      setStatus('Budget saved successfully.')
    } finally {
      setSaving(false)
    }
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
        <article className="insight-strip__item">
          <small>Total planned budget</small>
          <strong>{formatCurrency(totalLimit, currency)}</strong>
        </article>
        <article className="insight-strip__item">
          <small>Total spent</small>
          <strong>{formatCurrency(totalSpent, currency)}</strong>
        </article>
        <article className="insight-strip__item">
          <small>Remaining</small>
          <strong>{formatCurrency(totalLimit - totalSpent, currency)}</strong>
        </article>
        <article className="insight-strip__item">
          <small>Overspent categories</small>
          <strong>{overspentCount}</strong>
        </article>
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

      {status ? <p className="success-text">{status}</p> : null}
    </main>
  )
}
