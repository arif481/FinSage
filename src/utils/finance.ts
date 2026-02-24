import { Budget, BudgetProgress, FinanceTransaction, SpendingByCategory } from '@/types/finance'
import { toMonthKey } from '@/utils/format'

export const totalIncome = (transactions: FinanceTransaction[]): number => {
  return transactions.filter((txn) => txn.type === 'income').reduce((sum, txn) => sum + txn.amount, 0)
}

export const totalExpenses = (transactions: FinanceTransaction[]): number => {
  return transactions
    .filter((txn) => txn.type === 'expense')
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
}

export const netBalance = (transactions: FinanceTransaction[]): number => {
  return totalIncome(transactions) - totalExpenses(transactions)
}

export const spendingByCategory = (transactions: FinanceTransaction[]): SpendingByCategory[] => {
  const totals = new Map<string, number>()

  for (const txn of transactions) {
    if (txn.type !== 'expense') {
      continue
    }

    const nextAmount = (totals.get(txn.categoryId) ?? 0) + Math.abs(txn.amount)
    totals.set(txn.categoryId, nextAmount)
  }

  return Array.from(totals.entries()).map(([categoryId, amount]) => ({ categoryId, amount }))
}

export const budgetProgress = (
  budgets: Budget[],
  transactions: FinanceTransaction[],
  monthKey: string,
): BudgetProgress[] => {
  const spendingMap = new Map<string, number>()

  for (const txn of transactions) {
    if (txn.type !== 'expense') {
      continue
    }

    if (toMonthKey(txn.date) !== monthKey) {
      continue
    }

    const nextAmount = (spendingMap.get(txn.categoryId) ?? 0) + Math.abs(txn.amount)
    spendingMap.set(txn.categoryId, nextAmount)
  }

  return budgets
    .filter((budget) => budget.month === monthKey)
    .map((budget) => {
      const spent = spendingMap.get(budget.categoryId) ?? 0
      const remaining = budget.limit - spent
      const percent = budget.limit === 0 ? 0 : Math.min((spent / budget.limit) * 100, 999)

      return {
        categoryId: budget.categoryId,
        limit: budget.limit,
        spent,
        remaining,
        percent,
      }
    })
}

export interface MonthlyTrendPoint {
  month: string
  income: number
  expense: number
}

export const monthlyTrend = (transactions: FinanceTransaction[]): MonthlyTrendPoint[] => {
  const map = new Map<string, MonthlyTrendPoint>()

  for (const txn of transactions) {
    const key = toMonthKey(txn.date)
    const existing = map.get(key) ?? {
      month: key,
      income: 0,
      expense: 0,
    }

    if (txn.type === 'income') {
      existing.income += txn.amount
    } else {
      existing.expense += Math.abs(txn.amount)
    }

    map.set(key, existing)
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}
