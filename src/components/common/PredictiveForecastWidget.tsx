import { useMemo } from 'react'
import { FinanceTransaction, Budget } from '@/types/finance'
import { totalExpenses } from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'
import { useCurrency } from '@/hooks/useCurrency'

interface PredictiveForecastWidgetProps {
    transactions: FinanceTransaction[]
    budgets: Budget[]
}

export const PredictiveForecastWidget = ({ transactions, budgets }: PredictiveForecastWidgetProps) => {
    const currency = useCurrency()

    const forecast = useMemo(() => {
        const today = new Date()
        const currentMonth = toMonthKey(today.toISOString())

        const monthTransactions = transactions.filter(t => toMonthKey(t.date) === currentMonth)
        const currentSpend = totalExpenses(monthTransactions)

        const totalBudget = budgets.filter(b => b.month === currentMonth).reduce((acc, curr) => acc + curr.limit, 0)

        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
        const currentDay = today.getDate()
        const dailyAvg = currentSpend / (currentDay || 1)

        const projectedTotal = currentSpend + (dailyAvg * (daysInMonth - currentDay))
        const status = totalBudget > 0 && projectedTotal > totalBudget ? 'warning' : 'good'

        return {
            currentSpend,
            projectedTotal,
            totalBudget,
            status,
            diff: totalBudget > 0 ? totalBudget - projectedTotal : 0
        }
    }, [transactions, budgets])

    if (forecast.totalBudget === 0) return null

    return (
        <div className="card glass-panel" style={{ background: 'linear-gradient(120deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--bg-panel) 90%, transparent))', border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)', overflow: 'hidden', position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.3, zIndex: 0, animation: 'pulse-glow 4s infinite alternate ease-in-out' }} />
            <div style={{ position: 'relative', zIndex: 1, animation: 'fade-up 0.5s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="glow-text" style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.05em' }}>AI FORECAST</span>
                    <span className="table-category" style={{ background: forecast.status === 'warning' ? 'color-mix(in srgb, var(--warning) 20%, transparent)' : 'color-mix(in srgb, var(--success) 20%, transparent)', color: forecast.status === 'warning' ? 'var(--warning)' : 'var(--success)', border: 'none' }}>
                        {forecast.status === 'warning' ? 'Overbudget Risk' : 'On Track'}
                    </span>
                </div>
                <p style={{ fontSize: '1.05rem', fontWeight: 500, fontFamily: 'Space Grotesk, sans-serif' }}>
                    Based on your current daily average, you are projected to spend <strong>{formatCurrency(forecast.projectedTotal, currency)}</strong> this month.
                </p>
                <p style={{ marginTop: '0.6rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {forecast.status === 'warning'
                        ? `Warning: This exceeds your budget by ${formatCurrency(Math.abs(forecast.diff), currency)}. Try reducing discretionary spending over the next few days.`
                        : `Great job! You are projected to stay under budget by ${formatCurrency(forecast.diff, currency)}.`}
                </p>
            </div>
        </div>
    )
}
