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

/* ── Smart Analytics Utilities ── */

export interface DailySpendingPoint {
  date: string
  label: string
  amount: number
  cumulative: number
}

/** Returns day-by-day spending for the current month with cumulative totals */
export const dailySpending = (transactions: FinanceTransaction[], monthKey: string): DailySpendingPoint[] => {
  const dailyMap = new Map<string, number>()

  for (const txn of transactions) {
    if (txn.type !== 'expense' || toMonthKey(txn.date) !== monthKey) continue
    const day = txn.date.slice(0, 10)
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + Math.abs(txn.amount))
  }

  const days = Array.from(dailyMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  let cumulative = 0
  return days.map((d) => {
    cumulative += d.amount
    return {
      date: d.date,
      label: d.date.slice(8, 10),
      amount: Math.round(d.amount * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
    }
  })
}

export interface WeekdaySpendingPoint {
  day: string
  shortDay: string
  amount: number
  count: number
  average: number
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Analyzes spending patterns by day of the week */
export const weekdayAnalysis = (transactions: FinanceTransaction[]): WeekdaySpendingPoint[] => {
  const data = WEEKDAYS.map((day, i) => ({
    day,
    shortDay: SHORT_WEEKDAYS[i],
    total: 0,
    count: 0,
  }))

  for (const txn of transactions) {
    if (txn.type !== 'expense') continue
    const dayIndex = new Date(txn.date).getDay()
    data[dayIndex].total += Math.abs(txn.amount)
    data[dayIndex].count += 1
  }

  return data.map((d) => ({
    day: d.day,
    shortDay: d.shortDay,
    amount: Math.round(d.total * 100) / 100,
    count: d.count,
    average: d.count > 0 ? Math.round((d.total / d.count) * 100) / 100 : 0,
  }))
}

export interface CategoryComparisonItem {
  name: string
  color: string
  amount: number
  percentage: number
}

/** Returns categories sorted by expense amount with percentages for horizontal bar chart */
export const categoryComparison = (
  transactions: FinanceTransaction[],
  categories: { id: string; name: string; color: string }[],
): CategoryComparisonItem[] => {
  const totals = new Map<string, number>()

  for (const txn of transactions) {
    if (txn.type !== 'expense') continue
    totals.set(txn.categoryId, (totals.get(txn.categoryId) ?? 0) + Math.abs(txn.amount))
  }

  const grandTotal = Array.from(totals.values()).reduce((sum, v) => sum + v, 0)
  if (grandTotal === 0) return []

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => {
      const cat = categories.find((c) => c.id === categoryId)
      return {
        name: cat?.name ?? 'Other',
        color: cat?.color ?? '#8f95a1',
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round((amount / grandTotal) * 1000) / 10,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export interface HeatmapCell {
  date: string
  dayOfWeek: number
  week: number
  amount: number
  intensity: number // 0-4 scale
}

/** Generates a calendar heatmap grid for the given month */
export const spendingHeatmap = (transactions: FinanceTransaction[], monthKey: string): HeatmapCell[] => {
  const dailyMap = new Map<string, number>()

  for (const txn of transactions) {
    if (txn.type !== 'expense' || toMonthKey(txn.date) !== monthKey) continue
    const day = txn.date.slice(0, 10)
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + Math.abs(txn.amount))
  }

  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const maxAmount = Math.max(...Array.from(dailyMap.values()), 1)

  const cells: HeatmapCell[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(year, month - 1, d)
    const amount = dailyMap.get(dateStr) ?? 0
    const ratio = amount / maxAmount
    const intensity = amount === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4

    cells.push({
      date: dateStr,
      dayOfWeek: dateObj.getDay(),
      week: Math.floor((d + new Date(year, month - 1, 1).getDay() - 1) / 7),
      amount: Math.round(amount * 100) / 100,
      intensity,
    })
  }

  return cells
}

export interface SmartInsight {
  id: string
  icon: string
  title: string
  description: string
  tone: 'good' | 'warning' | 'danger' | 'primary'
  value?: string
}

/** Generates AI-like smart insights from transaction data */
export const generateSmartInsights = (
  transactions: FinanceTransaction[],
  budgets: Budget[],
  monthKey: string,
): SmartInsight[] => {
  const insights: SmartInsight[] = []
  const monthTxns = transactions.filter((t) => toMonthKey(t.date) === monthKey)
  const expenses = monthTxns.filter((t) => t.type === 'expense')
  const income = monthTxns.filter((t) => t.type === 'income')
  const totalExp = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalInc = income.reduce((s, t) => s + t.amount, 0)

  // Savings rate
  if (totalInc > 0) {
    const rate = Math.round(((totalInc - totalExp) / totalInc) * 100)
    insights.push({
      id: 'savings-rate',
      icon: rate >= 20 ? '🏆' : rate >= 10 ? '💰' : '⚠️',
      title: 'Savings Rate',
      description: rate >= 20 ? 'Excellent! You\'re saving above the recommended 20%.' : rate >= 10 ? 'Good progress. Aim for 20% to build a strong emergency fund.' : 'Below 10%. Review discretionary spending to improve.',
      tone: rate >= 20 ? 'good' : rate >= 10 ? 'warning' : 'danger',
      value: `${rate}%`,
    })
  }

  // Spending velocity
  const today = new Date()
  const dayOfMonth = today.getDate()
  if (totalExp > 0 && dayOfMonth > 1) {
    const dailyAvg = totalExp / dayOfMonth
    const projectedTotal = dailyAvg * 30
    const totalBudget = budgets.filter((b) => b.month === monthKey).reduce((s, b) => s + b.limit, 0)

    insights.push({
      id: 'velocity',
      icon: '📈',
      title: 'Spending Velocity',
      description: totalBudget > 0 && projectedTotal > totalBudget
        ? `At this pace, you\'ll exceed your ${Math.round(projectedTotal / totalBudget * 100)}% of budget by month end.`
        : `Averaging ${Math.round(dailyAvg)} per day. Projected monthly total: ${Math.round(projectedTotal)}.`,
      tone: totalBudget > 0 && projectedTotal > totalBudget ? 'danger' : 'primary',
      value: `${Math.round(dailyAvg)}/day`,
    })
  }

  // Biggest expense day
  const dayMap = new Map<string, number>()
  for (const t of expenses) {
    const d = t.date.slice(0, 10)
    dayMap.set(d, (dayMap.get(d) ?? 0) + Math.abs(t.amount))
  }
  const biggestDay = Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0]
  if (biggestDay) {
    insights.push({
      id: 'biggest-day',
      icon: '🔥',
      title: 'Biggest Spending Day',
      description: `${biggestDay[0]} saw ${Math.round(biggestDay[1])} in expenses — your highest this month.`,
      tone: 'warning',
      value: `${Math.round(biggestDay[1])}`,
    })
  }

  // Weekend vs weekday
  const weekendExp = expenses.filter((t) => { const d = new Date(t.date).getDay(); return d === 0 || d === 6 }).reduce((s, t) => s + Math.abs(t.amount), 0)
  if (totalExp > 0) {
    const weekendPct = Math.round((weekendExp / totalExp) * 100)
    insights.push({
      id: 'weekend-pattern',
      icon: weekendPct > 40 ? '🎉' : '📊',
      title: 'Weekend vs Weekday',
      description: weekendPct > 40
        ? `${weekendPct}% of spending happens on weekends. Consider setting weekend budgets.`
        : `Strong weekday discipline — only ${weekendPct}% of spend is on weekends.`,
      tone: weekendPct > 40 ? 'warning' : 'good',
      value: `${weekendPct}% weekend`,
    })
  }

  // Transaction frequency
  const uniqueDays = new Set(expenses.map((t) => t.date.slice(0, 10))).size
  if (uniqueDays > 0) {
    const avgPerDay = Math.round((expenses.length / uniqueDays) * 10) / 10
    insights.push({
      id: 'frequency',
      icon: '🔄',
      title: 'Transaction Frequency',
      description: avgPerDay > 3
        ? `${avgPerDay} transactions per active day. Many small purchases add up — consider batching.`
        : `${avgPerDay} transactions per active day across ${uniqueDays} days this month.`,
      tone: avgPerDay > 3 ? 'warning' : 'primary',
      value: `${avgPerDay} txn/day`,
    })
  }

  return insights
}
