import { useEffect, useMemo, useState } from 'react'
import { Budget, BudgetProgress, Category } from '@/types/finance'
import { formatCurrency } from '@/utils/format'

interface BudgetPlannerProps {
  budgets: Budget[]
  categories: Category[]
  currency: string
  month: string
  progress: BudgetProgress[]
  saving?: boolean
  onSaveBudget: (payload: { categoryId: string; limit: number; month: string }) => Promise<void>
}

export const BudgetPlanner = ({
  budgets,
  categories,
  currency,
  month,
  progress,
  saving,
  onSaveBudget,
}: BudgetPlannerProps) => {
  const [limits, setLimits] = useState<Record<string, number>>({})

  const existingByCategory = useMemo(() => {
    const map = new Map<string, Budget>()

    for (const budget of budgets) {
      if (budget.month !== month) {
        continue
      }

      map.set(budget.categoryId, budget)
    }

    return map
  }, [budgets, month])

  useEffect(() => {
    const nextLimits: Record<string, number> = {}

    for (const category of categories) {
      nextLimits[category.id] = existingByCategory.get(category.id)?.limit ?? 0
    }

    setLimits(nextLimits)
  }, [categories, existingByCategory])

  const handleSave = async () => {
    for (const categoryId of Object.keys(limits)) {
      const limit = Number(limits[categoryId])

      if (!Number.isFinite(limit) || limit <= 0) {
        continue
      }

      await onSaveBudget({ categoryId, limit, month })
    }
  }

  return (
    <div className="card stack" style={{ '--stagger': 1 } as React.CSSProperties}>
      <h3>📋 Budget planner</h3>
      <p className="section-subtitle">Set category limits for {month}.</p>

      {categories.map((category, index) => {
        const categoryProgress = progress.find((item) => item.categoryId === category.id)
        const spent = categoryProgress?.spent ?? 0
        const limit = categoryProgress?.limit ?? limits[category.id] ?? 0
        const percent = categoryProgress?.percent ?? 0
        const statusTone = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'good'

        return (
          <div key={category.id} className="budget-row" style={{ animation: `fade-up 350ms cubic-bezier(0.16, 1, 0.3, 1) both ${index * 60}ms` }}>
            <div className="budget-row__meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className={`status-dot status-dot--${statusTone}`} />
                <strong>{category.name}</strong>
              </div>
              <span>
                Spent {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
              </span>
            </div>

            <div className="budget-row__controls">
              <input
                aria-label={`${category.name} budget limit`}
                min={0}
                step={10}
                type="number"
                value={limits[category.id] ?? 0}
                onChange={(event) => {
                  setLimits((current) => ({
                    ...current,
                    [category.id]: Number(event.target.value),
                  }))
                }}
              />
              <div className="budget-row__progress">
                <progress
                  aria-label={`${category.name} usage`}
                  className={`budget-progress budget-progress--${statusTone}`}
                  max={100}
                  value={Math.min(percent, 100)}
                />
                <small style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{Math.round(percent)}% used</span>
                  {percent >= 100 && <span className="error-text" style={{ fontSize: '0.72rem' }}>Over budget!</span>}
                </small>
              </div>
            </div>
          </div>
        )
      })}

      <button
        className="primary-button"
        disabled={saving}
        type="button"
        onClick={() => void handleSave()}
      >
        {saving ? 'Saving...' : 'Save monthly budgets'}
      </button>
    </div>
  )
}
