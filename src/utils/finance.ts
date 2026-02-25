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
        ? `At this pace, you'll exceed your ${Math.round(projectedTotal / totalBudget * 100)}% of budget by month end.`
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

/* ── Phase 2: Advanced Smart Features ── */

export interface HealthScoreBreakdown {
  label: string
  score: number
  maxScore: number
  icon: string
  tone: 'good' | 'warning' | 'danger'
}

export interface FinancialHealthResult {
  totalScore: number
  grade: string
  gradeEmoji: string
  breakdown: HealthScoreBreakdown[]
  isEmpty: boolean
}

/** Composite financial health score 0-100 based on 5 weighted factors */
export const computeHealthScore = (
  transactions: FinanceTransaction[],
  budgets: Budget[],
  monthKey: string,
): FinancialHealthResult => {
  const monthTxns = transactions.filter((t) => toMonthKey(t.date) === monthKey)
  const expenses = monthTxns.filter((t) => t.type === 'expense')
  const totalExp = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalInc = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  // No data at all — return empty
  if (monthTxns.length === 0) {
    return {
      totalScore: 0,
      grade: '—',
      gradeEmoji: '📭',
      isEmpty: true,
      breakdown: [
        { label: 'Savings Rate', score: 0, maxScore: 25, icon: '💰', tone: 'danger' },
        { label: 'Budget Discipline', score: 0, maxScore: 25, icon: '📋', tone: 'danger' },
        { label: 'Tracking Consistency', score: 0, maxScore: 20, icon: '📊', tone: 'danger' },
        { label: 'Spending Diversity', score: 0, maxScore: 15, icon: '🎯', tone: 'danger' },
        { label: 'Month Trend', score: 0, maxScore: 15, icon: '📈', tone: 'danger' },
      ],
    }
  }

  const breakdown: HealthScoreBreakdown[] = []

  // 1. Savings rate (0-25 pts)
  const savingsRate = totalInc > 0 ? (totalInc - totalExp) / totalInc : 0
  const savingsScore = Math.min(Math.round(savingsRate * 100), 25)
  breakdown.push({ label: 'Savings Rate', score: Math.max(savingsScore, 0), maxScore: 25, icon: '💰', tone: savingsScore >= 15 ? 'good' : savingsScore >= 8 ? 'warning' : 'danger' })

  // 2. Budget adherence (0-25 pts)
  const monthBudgets = budgets.filter((b) => b.month === monthKey)
  let budgetScore = 0
  if (monthBudgets.length > 0) {
    const withinBudget = monthBudgets.filter((b) => {
      const spent = expenses.filter((e) => e.categoryId === b.categoryId).reduce((s, e) => s + Math.abs(e.amount), 0)
      return spent <= b.limit
    }).length
    budgetScore = Math.round((withinBudget / monthBudgets.length) * 25)
  } else {
    budgetScore = 0
  }
  breakdown.push({ label: 'Budget Discipline', score: budgetScore, maxScore: 25, icon: '📋', tone: budgetScore >= 18 ? 'good' : budgetScore >= 10 ? 'warning' : 'danger' })

  // 3. Consistency (0-20 pts) - logging transactions regularly
  const activeDays = new Set(monthTxns.map((t) => t.date.slice(0, 10))).size
  const today = new Date()
  const daysSoFar = today.getDate()
  const consistencyRatio = daysSoFar > 0 ? activeDays / daysSoFar : 0
  const consistencyScore = Math.min(Math.round(consistencyRatio * 30), 20)
  breakdown.push({ label: 'Tracking Consistency', score: consistencyScore, maxScore: 20, icon: '📊', tone: consistencyScore >= 14 ? 'good' : consistencyScore >= 8 ? 'warning' : 'danger' })

  // 4. Diversification (0-15 pts) - not spending too much on one category
  const catTotals = new Map<string, number>()
  for (const e of expenses) catTotals.set(e.categoryId, (catTotals.get(e.categoryId) ?? 0) + Math.abs(e.amount))
  const topCatPct = totalExp > 0 ? Math.max(...Array.from(catTotals.values())) / totalExp : 0
  const diversityScore = totalExp > 0 ? Math.round((1 - topCatPct) * 15) : 0
  breakdown.push({ label: 'Spending Diversity', score: Math.max(diversityScore, 0), maxScore: 15, icon: '🎯', tone: diversityScore >= 10 ? 'good' : diversityScore >= 5 ? 'warning' : 'danger' })

  // 5. Trend improvement (0-15 pts) - spending less than previous month
  const allMonths = monthlyTrend(transactions)
  const currentIdx = allMonths.findIndex((m) => m.month === monthKey)
  let trendScore = 0
  if (currentIdx > 0) {
    const prevExp = allMonths[currentIdx - 1].expense
    const curExp = allMonths[currentIdx].expense
    if (prevExp > 0) {
      const change = (curExp - prevExp) / prevExp
      trendScore = change <= -0.1 ? 15 : change <= 0 ? 12 : change <= 0.1 ? 8 : 4
    }
  }
  breakdown.push({ label: 'Month Trend', score: trendScore, maxScore: 15, icon: '📈', tone: trendScore >= 12 ? 'good' : trendScore >= 8 ? 'warning' : 'danger' })

  const totalScore = breakdown.reduce((s, b) => s + b.score, 0)
  const grade = totalScore >= 85 ? 'A+' : totalScore >= 75 ? 'A' : totalScore >= 65 ? 'B+' : totalScore >= 55 ? 'B' : totalScore >= 45 ? 'C' : totalScore >= 35 ? 'D' : 'F'
  const gradeEmoji = totalScore >= 75 ? '🌟' : totalScore >= 55 ? '👍' : totalScore >= 35 ? '⚡' : '🔴'

  return { totalScore, grade, gradeEmoji, breakdown, isEmpty: false }
}

export interface SpendingAnomaly {
  transaction: FinanceTransaction
  categoryAvg: number
  deviation: number
  reason: string
}

/** Detects spending anomalies — transactions significantly above category average */
export const detectAnomalies = (transactions: FinanceTransaction[]): SpendingAnomaly[] => {
  const expenses = transactions.filter((t) => t.type === 'expense')

  // Build category averages
  const catExpenses = new Map<string, number[]>()
  for (const e of expenses) {
    const list = catExpenses.get(e.categoryId) ?? []
    list.push(Math.abs(e.amount))
    catExpenses.set(e.categoryId, list)
  }

  const anomalies: SpendingAnomaly[] = []

  for (const e of expenses) {
    const amounts = catExpenses.get(e.categoryId) ?? []
    if (amounts.length < 3) continue

    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const deviation = Math.abs(e.amount) / avg

    if (deviation >= 2.5) {
      anomalies.push({
        transaction: e,
        categoryAvg: Math.round(avg * 100) / 100,
        deviation: Math.round(deviation * 10) / 10,
        reason: `${deviation.toFixed(1)}x above category average (${Math.round(avg)})`,
      })
    }
  }

  return anomalies.sort((a, b) => b.deviation - a.deviation).slice(0, 8)
}

export interface MonthComparisonItem {
  label: string
  current: number
  previous: number
  change: number
  changePct: number
}

/** Compare current month vs previous month across key metrics */
export const monthOverMonthComparison = (
  transactions: FinanceTransaction[],
  currentMonthKey: string,
): MonthComparisonItem[] => {
  const [year, month] = currentMonthKey.split('-').map(Number)
  const prevDate = new Date(year, month - 2, 1)
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const curTxns = transactions.filter((t) => toMonthKey(t.date) === currentMonthKey)
  const prevTxns = transactions.filter((t) => toMonthKey(t.date) === prevMonthKey)

  const curExp = curTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  const prevExp = prevTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  const curInc = curTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevInc = prevTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const curTxnCount = curTxns.length
  const prevTxnCount = prevTxns.length

  const pct = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0

  return [
    { label: 'Total Expenses', current: curExp, previous: prevExp, change: curExp - prevExp, changePct: pct(curExp, prevExp) },
    { label: 'Total Income', current: curInc, previous: prevInc, change: curInc - prevInc, changePct: pct(curInc, prevInc) },
    { label: 'Net Savings', current: curInc - curExp, previous: prevInc - prevExp, change: (curInc - curExp) - (prevInc - prevExp), changePct: pct(curInc - curExp, prevInc - prevExp) },
    { label: 'Transactions', current: curTxnCount, previous: prevTxnCount, change: curTxnCount - prevTxnCount, changePct: pct(curTxnCount, prevTxnCount) },
  ]
}

export interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  progress: number // 0-100
}

/** Generate gamification achievements based on financial behavior */
export const computeAchievements = (
  transactions: FinanceTransaction[],
  budgets: Budget[],
  monthKey: string,
): Achievement[] => {
  const monthTxns = transactions.filter((t) => toMonthKey(t.date) === monthKey)
  const expenses = monthTxns.filter((t) => t.type === 'expense')
  const totalExp = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalInc = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const activeDays = new Set(monthTxns.map((t) => t.date.slice(0, 10))).size
  const monthBudgets = budgets.filter((b) => b.month === monthKey)

  const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0
  const withinBudget = monthBudgets.filter((b) => {
    const spent = expenses.filter((e) => e.categoryId === b.categoryId).reduce((s, e) => s + Math.abs(e.amount), 0)
    return spent <= b.limit
  }).length

  return [
    {
      id: 'first-log', icon: '✏️', title: 'First Log',
      description: 'Record your first transaction',
      unlocked: transactions.length > 0,
      progress: Math.min(transactions.length > 0 ? 100 : 0, 100),
    },
    {
      id: 'week-streak', icon: '🔥', title: '7-Day Streak',
      description: 'Log transactions 7 days this month',
      unlocked: activeDays >= 7,
      progress: Math.min(Math.round((activeDays / 7) * 100), 100),
    },
    {
      id: 'saver-20', icon: '🏆', title: 'Super Saver',
      description: 'Achieve a 20% or higher savings rate',
      unlocked: savingsRate >= 20,
      progress: Math.min(Math.round(savingsRate / 20 * 100), 100),
    },
    {
      id: 'budget-master', icon: '🎯', title: 'Budget Master',
      description: 'Stay within all set budgets this month',
      unlocked: monthBudgets.length > 0 && withinBudget === monthBudgets.length,
      progress: monthBudgets.length > 0 ? Math.round((withinBudget / monthBudgets.length) * 100) : 0,
    },
    {
      id: 'century', icon: '💯', title: 'Century Club',
      description: 'Record 100 total transactions',
      unlocked: transactions.length >= 100,
      progress: Math.min(Math.round((transactions.length / 100) * 100), 100),
    },
    {
      id: 'diversifier', icon: '🌈', title: 'Diversifier',
      description: 'Log expenses in 5+ categories this month',
      unlocked: new Set(expenses.map((e) => e.categoryId)).size >= 5,
      progress: Math.min(Math.round((new Set(expenses.map((e) => e.categoryId)).size / 5) * 100), 100),
    },
  ]
}

export interface CashFlowItem {
  name: string
  value: number
  fill: string
  isIncome: boolean
}

/** Generates waterfall data: income on top, then each expense category subtracting */
export const cashFlowWaterfall = (
  transactions: FinanceTransaction[],
  categories: { id: string; name: string; color: string }[],
  monthKey: string,
): CashFlowItem[] => {
  const monthTxns = transactions.filter((t) => toMonthKey(t.date) === monthKey)
  const totalInc = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTxns.filter((t) => t.type === 'expense')

  const catTotals = new Map<string, number>()
  for (const e of expenses) catTotals.set(e.categoryId, (catTotals.get(e.categoryId) ?? 0) + Math.abs(e.amount))

  const items: CashFlowItem[] = [
    { name: 'Income', value: Math.round(totalInc * 100) / 100, fill: 'var(--success)', isIncome: true },
  ]

  const sorted = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1])
  for (const [catId, amount] of sorted) {
    const cat = categories.find((c) => c.id === catId)
    items.push({
      name: cat?.name ?? 'Other',
      value: Math.round(amount * 100) / 100,
      fill: cat?.color ?? '#8f95a1',
      isIncome: false,
    })
  }

  const netSavings = totalInc - expenses.reduce((s, e) => s + Math.abs(e.amount), 0)
  items.push({ name: 'Net Savings', value: Math.round(netSavings * 100) / 100, fill: netSavings >= 0 ? 'var(--success)' : 'var(--danger)', isIncome: false })

  return items
}

/* ── Phase 3: Smart Visuals Pack 3 ── */

export interface TreemapNode {
  name: string
  size: number
  color: string
}

/** Prepares data for a Category Treemap visualization */
export const categoryTreemapData = (
  transactions: FinanceTransaction[],
  categories: { id: string; name: string; color: string }[],
  monthKey: string,
): TreemapNode[] => {
  const expenses = transactions.filter((t) => t.type === 'expense' && toMonthKey(t.date) === monthKey)
  const totals = new Map<string, number>()

  for (const e of expenses) {
    totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + Math.abs(e.amount))
  }

  return Array.from(totals.entries())
    .map(([catId, size]) => {
      const cat = categories.find((c) => c.id === catId)
      return {
        name: cat?.name ?? 'Other',
        size: Math.round(size * 100) / 100,
        color: cat?.color ?? '#8f95a1',
      }
    })
    .filter((n) => n.size > 0)
    .sort((a, b) => b.size - a.size)
}

export interface NetWorthPoint {
  month: string
  projected: number
}

/** Projects net worth/savings 12 months into the future based on recent average */
export const netWorthProjectionData = (transactions: FinanceTransaction[]): NetWorthPoint[] => {
  const trends = monthlyTrend(transactions)
  if (trends.length === 0) return []

  // Calculate average monthly savings from the last 3 active months
  const recent = trends.slice(-3)
  const avgSavings = recent.reduce((sum, m) => sum + (m.income - m.expense), 0) / recent.length

  // Base starting amount (sum of all historical net savings)
  let currentNet = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount)), 0)

  const projection: NetWorthPoint[] = []
  const today = new Date()

  // Project 6 months into the future
  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const monthName = futureDate.toLocaleString('default', { month: 'short', year: '2-digit' })
    currentNet += avgSavings
    projection.push({ month: monthName, projected: Math.round(currentNet) })
  }

  return projection
}

export interface VelocityData {
  value: number
  target: number
  status: 'good' | 'warning' | 'danger'
  percent: number
}

/** Calculates spending velocity for a dial/speedometer gauge */
export const velocityGaugeData = (
  transactions: FinanceTransaction[],
  budgets: Budget[],
  monthKey: string
): VelocityData => {
  const monthTxns = transactions.filter((t) => toMonthKey(t.date) === monthKey)
  const expenses = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalBudget = budgets.filter((b) => b.month === monthKey).reduce((s, b) => s + b.limit, 0)

  if (totalBudget === 0) return { value: expenses, target: 0, status: 'good', percent: 0 }

  const percent = Math.min(Math.round((expenses / totalBudget) * 100), 150) // Cap at 150% for the gauge
  const status = percent > 100 ? 'danger' : percent > 80 ? 'warning' : 'good'

  return { value: expenses, target: totalBudget, status, percent }
}

export interface ScatterPoint {
  day: number
  amount: number
  type: 'income' | 'expense'
  categoryName: string
}

/** Prepares transaction data for an Income vs Expense scatter plot clustering */
export const transactionScatterData = (
  transactions: FinanceTransaction[],
  categories: { id: string; name: string; color: string }[],
  monthKey: string
): ScatterPoint[] => {
  const monthTxns = transactions.filter((t) => toMonthKey(t.date) === monthKey)

  return monthTxns.map((t) => {
    const date = new Date(t.date)
    const cat = categories.find((c) => c.id === t.categoryId)
    return {
      day: date.getDate(),
      amount: Math.abs(t.amount),
      type: t.type,
      categoryName: typeof t.categoryId === 'string' && t.categoryId.startsWith('income') ? 'Income' : (cat?.name ?? 'Other')
    }
  })
}

