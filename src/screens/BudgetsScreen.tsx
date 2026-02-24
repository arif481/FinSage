import { useState } from 'react'
import { BudgetPlanner } from '@/features/budgets/BudgetPlanner'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { upsertBudget } from '@/services/firestore/budgets'
import { budgetProgress } from '@/utils/finance'
import { toMonthKey } from '@/utils/format'

export const BudgetsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { budgets, categories, loading, transactions } = useFinanceCollections(user?.uid)
  const [month, setMonth] = useState(toMonthKey(new Date().toISOString()))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const progress = budgetProgress(budgets, transactions, month)

  const handleSaveBudget = async (payload: { categoryId: string; limit: number; month: string }) => {
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
      <header className="screen-header">
        <div>
          <h2>Budget planner</h2>
          <p className="section-subtitle">Define category budgets and monitor usage in real time.</p>
        </div>
        <label className="field field--inline">
          <span>Month</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </header>

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
