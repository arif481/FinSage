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
  const approachingCount = progress.filter((item) => item.percent >= 80 && item.percent < 100).length

  // Previous month rollover calculation
  const [prevYear, prevMonth] = month.split('-').map(Number)
  const prevDate = new Date(prevYear, prevMonth - 2, 1)
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const prevProgress = budgetProgress(budgets, transactions, prevMonthKey)
  const prevUnderBudget = prevProgress.reduce((sum, item) => sum + Math.max(item.remaining, 0), 0)
  const prevOverBudget = prevProgress.reduce((sum, item) => sum + Math.abs(Math.min(item.remaining, 0)), 0)

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

  const handleAiSuggest = () => {
    // Analyze last 3 months of spending per category and suggest budgets
    const suggestions: string[] = []
    const monthKeys: string[] = []
    const today = new Date()
    for (let i = 1; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const catSpending = new Map<string, number[]>()
    for (const txn of transactions) {
      if (txn.type !== 'expense') continue
      const mk = toMonthKey(txn.date)
      if (!monthKeys.includes(mk)) continue
      const list = catSpending.get(txn.categoryId) ?? []
      list.push(Math.abs(txn.amount))
      catSpending.set(txn.categoryId, list)
    }

    for (const [catId, amounts] of catSpending.entries()) {
      const avg = amounts.reduce((s, a) => s + a, 0) / Math.max(monthKeys.length, 1)
      const suggested = Math.ceil(avg * 1.1 / 10) * 10 // Round up to nearest 10 with 10% buffer
      const cat = categories.find((c) => c.id === catId)
      if (cat) {
        suggestions.push(`${cat.name}: ${formatCurrency(suggested, currency)}`)
      }
    }

    if (suggestions.length > 0) {
      showToast(`AI suggests: ${suggestions.join(' • ')}`, 'success')
    } else {
      showToast('Not enough spending data for suggestions. Track at least 1 month of expenses.', 'error')
    }
  }

  const getCategoryName = (catId: string) => categories.find((c) => c.id === catId)?.name ?? catId
  const getCategoryColor = (catId: string) => categories.find((c) => c.id === catId)?.color ?? '#8f95a1'

  const insightData = [
    { label: 'Total planned', value: formatCurrency(totalLimit, currency) },
    { label: 'Total spent', value: formatCurrency(totalSpent, currency) },
    { label: 'Remaining', value: formatCurrency(totalLimit - totalSpent, currency) },
    { label: 'Status', value: overspentCount > 0 ? `${overspentCount} overspent` : approachingCount > 0 ? `${approachingCount} near limit` : '✅ On track' },
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="secondary-button" type="button" onClick={handleAiSuggest} style={{ fontSize: '0.85rem' }}>
            🤖 AI Suggest
          </button>
          <label className="field field--inline">
            <span>Month</span>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        </div>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong style={{
              color: item.label === 'Status' && overspentCount > 0 ? 'var(--danger)' :
                item.label === 'Status' && approachingCount > 0 ? 'var(--warning, orange)' : undefined,
            }}>
              {item.value}
            </strong>
          </article>
        ))}
      </section>

      {/* Rollover from previous month */}
      {prevProgress.length > 0 && (
        <section className="card" style={{ '--stagger': 0, animation: 'fade-up 400ms ease both' } as React.CSSProperties}>
          <h3 style={{ marginBottom: '0.5rem' }}>📊 Previous Month Rollover</h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <small style={{ color: 'var(--text-muted)' }}>Under-budget surplus</small>
              <p style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem', margin: 0 }}>
                +{formatCurrency(prevUnderBudget, currency)}
              </p>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)' }}>Over-budget deficit</small>
              <p style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '1.1rem', margin: 0 }}>
                -{formatCurrency(prevOverBudget, currency)}
              </p>
            </div>
            <div>
              <small style={{ color: 'var(--text-muted)' }}>Net rollover</small>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0, color: prevUnderBudget - prevOverBudget >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(prevUnderBudget - prevOverBudget, currency)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Budget progress cards */}
      {progress.length > 0 && (
        <section className="stack" style={{ gap: '0.75rem' }}>
          <h3>📋 Category Progress</h3>
          {progress.map((item, i) => {
            const pct = Math.min(Math.round(item.percent), 100)
            const isOver = item.remaining < 0
            const isNear = item.percent >= 80 && !isOver
            const barColor = isOver ? 'var(--danger)' : isNear ? 'var(--warning, orange)' : getCategoryColor(item.categoryId)

            return (
              <article key={item.categoryId} className="card" style={{
                '--stagger': i + 1,
                borderLeft: `4px solid ${barColor}`,
              } as React.CSSProperties}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getCategoryName(item.categoryId)}
                    {isOver && <span style={{ fontSize: '0.75rem', background: 'var(--danger)', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>OVERSPENT</span>}
                    {isNear && <span style={{ fontSize: '0.75rem', background: 'var(--warning, orange)', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>NEAR LIMIT</span>}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {formatCurrency(item.spent, currency)} / {formatCurrency(item.limit, currency)}
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '4px',
                    background: barColor,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{Math.round(item.percent)}% used</span>
                  <span style={{ color: isOver ? 'var(--danger)' : undefined }}>
                    {isOver ? `${formatCurrency(Math.abs(item.remaining), currency)} over` : `${formatCurrency(item.remaining, currency)} left`}
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      )}

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
