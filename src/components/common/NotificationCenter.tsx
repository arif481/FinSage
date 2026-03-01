import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { formatCurrency } from '@/utils/format'
import { budgetProgress } from '@/utils/finance'
import { toMonthKey } from '@/utils/format'

interface Notification {
    id: string
    icon: string
    title: string
    message: string
    severity: 'info' | 'warning' | 'danger' | 'success'
    action?: { label: string; to: string }
}

export const NotificationCenter = () => {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()
    const { user } = useAuth()
    const currency = useCurrency()
    const {
        budgets,
        loans,
        recurringRules,
        savingsGoals,
        transactions,
    } = useFinanceCollections(user?.uid)

    const notifications = useMemo<Notification[]>(() => {
        const now = new Date()
        const currentMonth = toMonthKey(now.toISOString())
        const items: Notification[] = []

        // Budget alerts
        const progress = budgetProgress(budgets, transactions, currentMonth)
        for (const bp of progress) {
            if (bp.remaining < 0) {
                items.push({
                    id: `budget-over-${bp.categoryId}`,
                    icon: '🚨',
                    title: 'Budget exceeded',
                    message: `${bp.categoryId} is ${formatCurrency(Math.abs(bp.remaining), currency)} over budget`,
                    severity: 'danger',
                    action: { label: 'View budgets', to: '/budgets' },
                })
            } else if (bp.percent >= 80) {
                items.push({
                    id: `budget-near-${bp.categoryId}`,
                    icon: '⚠️',
                    title: 'Approaching budget limit',
                    message: `${bp.categoryId} is at ${Math.round(bp.percent)}% — ${formatCurrency(bp.remaining, currency)} left`,
                    severity: 'warning',
                    action: { label: 'View budgets', to: '/budgets' },
                })
            }
        }

        // Overdue loans
        const overdueLoans = loans.filter(l => l.status === 'active' && l.dueDate && new Date(l.dueDate) < now)
        for (const loan of overdueLoans) {
            items.push({
                id: `loan-overdue-${loan.id}`,
                icon: '💸',
                title: 'Overdue loan',
                message: `${loan.person} — ${formatCurrency(loan.amount, currency)} was due ${loan.dueDate}`,
                severity: 'danger',
                action: { label: 'View loans', to: '/loans' },
            })
        }

        // Upcoming loans (next 7 days)
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const upcomingLoans = loans.filter(l =>
            l.status === 'active' && l.dueDate &&
            new Date(l.dueDate) >= now && new Date(l.dueDate) <= weekFromNow
        )
        for (const loan of upcomingLoans) {
            items.push({
                id: `loan-upcoming-${loan.id}`,
                icon: '📅',
                title: 'Loan due soon',
                message: `${loan.person} — ${formatCurrency(loan.amount, currency)} due ${loan.dueDate}`,
                severity: 'warning',
                action: { label: 'View loans', to: '/loans' },
            })
        }

        // Recurring rules due today or overdue
        const today = now.toISOString().slice(0, 10)
        for (const rule of recurringRules.filter(r => r.active && r.nextRun <= today)) {
            items.push({
                id: `recurring-due-${rule.id}`,
                icon: '🔄',
                title: 'Recurring transaction due',
                message: `${rule.description} — ${formatCurrency(rule.amount, currency)}`,
                severity: 'info',
                action: { label: 'View recurring', to: '/recurring' },
            })
        }

        // Goal milestones
        for (const goal of savingsGoals.filter(g => g.status === 'active')) {
            const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
            if (pct >= 100) {
                items.push({
                    id: `goal-complete-${goal.id}`,
                    icon: '🎉',
                    title: 'Goal reached!',
                    message: `"${goal.name}" has reached its target of ${formatCurrency(goal.targetAmount, currency)}`,
                    severity: 'success',
                    action: { label: 'View goals', to: '/goals' },
                })
            } else if (pct >= 75) {
                items.push({
                    id: `goal-near-${goal.id}`,
                    icon: '🎯',
                    title: 'Goal almost there',
                    message: `"${goal.name}" is ${Math.round(pct)}% complete`,
                    severity: 'info',
                    action: { label: 'View goals', to: '/goals' },
                })
            }
        }

        return items
    }, [budgets, transactions, loans, recurringRules, savingsGoals, currency])

    const dangerCount = notifications.filter(n => n.severity === 'danger').length
    const totalCount = notifications.length

    const severityColor: Record<string, string> = {
        info: 'var(--primary)',
        warning: 'orange',
        danger: 'var(--danger)',
        success: 'var(--success)',
    }

    return (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                aria-label={`Notifications (${totalCount})`}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: '0.5rem',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {totalCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        background: dangerCount > 0 ? 'var(--danger)' : 'var(--primary)',
                        color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                        width: '1.1rem', height: '1.1rem', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} onClick={() => setOpen(false)} />
                    <div className="glass-panel" style={{
                        position: 'absolute', top: '100%', right: 0, zIndex: 90,
                        width: '360px', maxHeight: '480px', overflowY: 'auto',
                        borderRadius: '1rem', marginTop: '0.5rem',
                        boxShadow: 'var(--glow-primary)',
                        animation: 'fade-up 200ms ease forwards',
                    }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0 }}>🔔 Notifications</h4>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {totalCount === 0 ? 'All clear!' : `${totalCount} alert${totalCount > 1 ? 's' : ''}`}
                            </span>
                        </div>

                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>✅</p>
                                <p>No notifications — everything looks great!</p>
                            </div>
                        ) : (
                            <div style={{ padding: '0.5rem' }}>
                                {notifications.map((notif, i) => (
                                    <div key={notif.id} style={{
                                        display: 'flex', gap: '0.75rem', padding: '0.75rem',
                                        borderRadius: '0.5rem', cursor: notif.action ? 'pointer' : 'default',
                                        borderLeft: `3px solid ${severityColor[notif.severity]}`,
                                        marginBottom: '0.25rem',
                                        animation: `fade-up 200ms ease both ${i * 40}ms`,
                                        transition: 'background 0.15s',
                                    }}
                                        onClick={() => {
                                            if (notif.action) {
                                                navigate(notif.action.to)
                                                setOpen(false)
                                            }
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                    >
                                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{notif.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <strong style={{ fontSize: '0.85rem', display: 'block' }}>{notif.title}</strong>
                                            <small style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{notif.message}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
